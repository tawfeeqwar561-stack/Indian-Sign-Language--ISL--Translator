/**
 * Client-side ISL Sign Classifier.
 * Uses hand landmark geometry (finger angles, distances, positions)
 * to classify hand poses into Indian Sign Language signs.
 * 
 * This is a rule-based classifier using geometric features extracted
 * from MediaPipe hand landmarks. Each sign is defined by a set of
 * conditions on finger states and hand positions.
 */

// MediaPipe landmark indices
const WRIST = 0;
const THUMB_CMC = 1, THUMB_MCP = 2, THUMB_IP = 3, THUMB_TIP = 4;
const INDEX_MCP = 5, INDEX_PIP = 6, INDEX_DIP = 7, INDEX_TIP = 8;
const MIDDLE_MCP = 9, MIDDLE_PIP = 10, MIDDLE_DIP = 11, MIDDLE_TIP = 12;
const RING_MCP = 13, RING_PIP = 14, RING_DIP = 15, RING_TIP = 16;
const PINKY_MCP = 17, PINKY_PIP = 18, PINKY_DIP = 19, PINKY_TIP = 20;

/**
 * Calculate distance between two landmarks
 */
function dist(lm, a, b) {
  const dx = lm[a].x - lm[b].x;
  const dy = lm[a].y - lm[b].y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between three points (in degrees)
 */
function angle(lm, a, b, c) {
  const ba = { x: lm[a].x - lm[b].x, y: lm[a].y - lm[b].y };
  const bc = { x: lm[c].x - lm[b].x, y: lm[c].y - lm[b].y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const cross = ba.x * bc.y - ba.y * bc.x;
  const rad = Math.atan2(Math.abs(cross), dot);
  return (rad * 180) / Math.PI;
}

/**
 * Check if a finger is extended (straight)
 */
function isFingerExtended(lm, mcp, pip, dip, tip) {
  const a = angle(lm, mcp, pip, dip);
  const b = angle(lm, pip, dip, tip);
  // finger is extended if joints are relatively straight
  return a > 140 && b > 140;
}

/**
 * Check if a finger is curled (bent)
 */
function isFingerCurled(lm, mcp, pip, dip, tip) {
  // Tip is closer to wrist than MCP
  const tipDist = dist(lm, WRIST, tip);
  const mcpDist = dist(lm, WRIST, mcp);
  return tipDist < mcpDist * 1.1;
}

/**
 * Check if thumb is extended
 */
function isThumbExtended(lm) {
  const tipDist = dist(lm, THUMB_TIP, INDEX_MCP);
  const mcpDist = dist(lm, THUMB_MCP, INDEX_MCP);
  return tipDist > mcpDist * 0.9;
}

/**
 * Get finger states: returns { thumb, index, middle, ring, pinky } booleans
 */
function getFingerStates(lm) {
  return {
    thumb: isThumbExtended(lm),
    index: isFingerExtended(lm, INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP),
    middle: isFingerExtended(lm, MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP),
    ring: isFingerExtended(lm, RING_MCP, RING_PIP, RING_DIP, RING_TIP),
    pinky: isFingerExtended(lm, PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP),
  };
}

/**
 * Count extended fingers
 */
function countExtended(fingers) {
  return Object.values(fingers).filter(Boolean).length;
}

/**
 * ISL Sign definitions based on hand geometry
 * Each sign has: name, detect(landmarks, fingers, handedness) -> confidence
 */
const ISL_SIGNS = [
  {
    name: 'hello',
    detect: (lm, f) => {
      // Open palm, all fingers extended, palm facing out
      if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
        // Check fingers are spread
        const spread = dist(lm, INDEX_TIP, PINKY_TIP);
        const palmSize = dist(lm, WRIST, MIDDLE_MCP);
        if (spread > palmSize * 0.8) {
          return 0.85;
        }
        return 0.7;
      }
      return 0;
    },
    translations: {
      en: 'Hello! / Namaste',
      hi: 'नमस्ते!',
      ta: 'வணக்கம்!',
    },
  },
  {
    name: 'thank_you',
    detect: (lm, f) => {
      // Flat hand touching chin area — approximated as flat hand near face level
      if (f.index && f.middle && f.ring && f.pinky && !f.thumb) {
        const handY = lm[MIDDLE_TIP].y;
        if (handY < 0.4) {
          return 0.8;
        }
      }
      // Also: open palm with fingers together, palm up
      if (f.index && f.middle && f.ring && f.pinky) {
        const fingerSpread = dist(lm, INDEX_TIP, PINKY_TIP);
        const palmSize = dist(lm, WRIST, MIDDLE_MCP);
        if (fingerSpread < palmSize * 0.5) {
          return 0.72;
        }
      }
      return 0;
    },
    translations: {
      en: 'Thank you',
      hi: 'धन्यवाद',
      ta: 'நன்றி',
    },
  },
  {
    name: 'yes',
    detect: (lm, f) => {
      // Fist with thumb up
      if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
        // Thumb should be pointing up
        if (lm[THUMB_TIP].y < lm[THUMB_MCP].y) {
          return 0.88;
        }
        return 0.65;
      }
      return 0;
    },
    translations: {
      en: 'Yes',
      hi: 'हाँ',
      ta: 'ஆம்',
    },
  },
  {
    name: 'no',
    detect: (lm, f) => {
      // Index finger wagging / extended index with others closed
      if (f.index && !f.middle && !f.ring && !f.pinky) {
        // Index finger extended, others curled, moving side to side
        if (!f.thumb) {
          return 0.82;
        }
        return 0.7;
      }
      return 0;
    },
    translations: {
      en: 'No',
      hi: 'नहीं',
      ta: 'இல்லை',
    },
  },
  {
    name: 'please',
    detect: (lm, f) => {
      // Open palm placed on chest area — flat hand
      if (f.index && f.middle && f.ring && !f.pinky && f.thumb) {
        return 0.72;
      }
      return 0;
    },
    translations: {
      en: 'Please',
      hi: 'कृपया',
      ta: 'தயவுசெய்து',
    },
  },
  {
    name: 'sorry',
    detect: (lm, f) => {
      // Fist circling on chest — approximated as closed fist
      if (!f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
        return 0.75;
      }
      return 0;
    },
    translations: {
      en: 'Sorry',
      hi: 'माफ़ कीजिये',
      ta: 'மன்னிக்கவும்',
    },
  },
  {
    name: 'help',
    detect: (lm, f) => {
      // Thumbs up on flat palm — one fist with thumb up
      if (f.thumb && f.index && !f.middle && !f.ring && !f.pinky) {
        // L-shape: thumb and index
        const thumbIdx = dist(lm, THUMB_TIP, INDEX_TIP);
        const palmSize = dist(lm, WRIST, MIDDLE_MCP);
        if (thumbIdx > palmSize * 0.6) {
          return 0.78;
        }
      }
      return 0;
    },
    translations: {
      en: 'Help',
      hi: 'मदद',
      ta: 'உதவி',
    },
  },
  {
    name: 'water',
    detect: (lm, f) => {
      // W-shape: three fingers extended (index, middle, ring)
      if (f.index && f.middle && f.ring && !f.pinky && !f.thumb) {
        return 0.8;
      }
      return 0;
    },
    translations: {
      en: 'Water',
      hi: 'पानी',
      ta: 'தண்ணீர்',
    },
  },
  {
    name: 'food',
    detect: (lm, f) => {
      // Fingers bunched together touching mouth — approximated
      const allTips = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];
      const centerX = allTips.reduce((s, i) => s + lm[i].x, 0) / 5;
      const centerY = allTips.reduce((s, i) => s + lm[i].y, 0) / 5;
      const maxSpread = Math.max(...allTips.map(i =>
        Math.sqrt((lm[i].x - centerX) ** 2 + (lm[i].y - centerY) ** 2)
      ));
      if (maxSpread < 0.06 && centerY < 0.4) {
        return 0.77;
      }
      return 0;
    },
    translations: {
      en: 'Food / Eat',
      hi: 'खाना',
      ta: 'உணவு',
    },
  },
  {
    name: 'love',
    detect: (lm, f) => {
      // ILY sign: thumb, index, pinky extended; middle, ring closed
      if (f.thumb && f.index && !f.middle && !f.ring && f.pinky) {
        return 0.9;
      }
      return 0;
    },
    translations: {
      en: 'I Love You',
      hi: 'मैं तुमसे प्यार करता/करती हूँ',
      ta: 'நான் உன்னை காதலிக்கிறேன்',
    },
  },
  {
    name: 'peace',
    detect: (lm, f) => {
      // V-sign / peace: index and middle extended, others closed
      if (f.index && f.middle && !f.ring && !f.pinky) {
        const spread = dist(lm, INDEX_TIP, MIDDLE_TIP);
        const palmSize = dist(lm, WRIST, MIDDLE_MCP);
        if (spread > palmSize * 0.2 && !f.thumb) {
          return 0.85;
        }
        return 0.7;
      }
      return 0;
    },
    translations: {
      en: 'Peace / Victory',
      hi: 'शांति',
      ta: 'அமைதி',
    },
  },
  {
    name: 'stop',
    detect: (lm, f) => {
      // Open palm facing out, fingers together
      if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
        const spread = dist(lm, INDEX_TIP, PINKY_TIP);
        const palmSize = dist(lm, WRIST, MIDDLE_MCP);
        // Fingers together (not spread)
        if (spread < palmSize * 0.7) {
          return 0.78;
        }
      }
      return 0;
    },
    translations: {
      en: 'Stop',
      hi: 'रुको',
      ta: 'நிறுத்து',
    },
  },
  {
    name: 'good',
    detect: (lm, f) => {
      // Thumbs up (same as yes but thumb clearly up)
      if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
        if (lm[THUMB_TIP].y < lm[THUMB_IP].y && lm[THUMB_IP].y < lm[THUMB_MCP].y) {
          return 0.83;
        }
      }
      return 0;
    },
    translations: {
      en: 'Good / Okay',
      hi: 'अच्छा',
      ta: 'நல்லது',
    },
  },
  {
    name: 'bad',
    detect: (lm, f) => {
      // Thumbs down
      if (f.thumb && !f.index && !f.middle && !f.ring && !f.pinky) {
        if (lm[THUMB_TIP].y > lm[THUMB_MCP].y) {
          return 0.82;
        }
      }
      return 0;
    },
    translations: {
      en: 'Bad',
      hi: 'बुरा',
      ta: 'கெட்ட',
    },
  },
  {
    name: 'one',
    detect: (lm, f) => {
      if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) {
        return 0.85;
      }
      return 0;
    },
    translations: {
      en: 'One (1)',
      hi: 'एक (१)',
      ta: 'ஒன்று (௧)',
    },
  },
  {
    name: 'two',
    detect: (lm, f) => {
      if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb) {
        const spread = dist(lm, INDEX_TIP, MIDDLE_TIP);
        const palmSize = dist(lm, WRIST, MIDDLE_MCP);
        if (spread < palmSize * 0.3) {
          return 0.82;
        }
      }
      return 0;
    },
    translations: {
      en: 'Two (2)',
      hi: 'दो (२)',
      ta: 'இரண்டு (௨)',
    },
  },
  {
    name: 'three',
    detect: (lm, f) => {
      if (f.index && f.middle && f.ring && !f.pinky && !f.thumb) {
        return 0.8;
      }
      // Also: thumb + index + middle
      if (f.thumb && f.index && f.middle && !f.ring && !f.pinky) {
        return 0.75;
      }
      return 0;
    },
    translations: {
      en: 'Three (3)',
      hi: 'तीन (३)',
      ta: 'மூன்று (௩)',
    },
  },
  {
    name: 'four',
    detect: (lm, f) => {
      if (f.index && f.middle && f.ring && f.pinky && !f.thumb) {
        return 0.82;
      }
      return 0;
    },
    translations: {
      en: 'Four (4)',
      hi: 'चार (४)',
      ta: 'நான்கு (௪)',
    },
  },
  {
    name: 'five',
    detect: (lm, f) => {
      if (f.thumb && f.index && f.middle && f.ring && f.pinky) {
        const spread = dist(lm, INDEX_TIP, PINKY_TIP);
        const palmSize = dist(lm, WRIST, MIDDLE_MCP);
        if (spread > palmSize * 0.7) {
          return 0.78;
        }
      }
      return 0;
    },
    translations: {
      en: 'Five (5)',
      hi: 'पाँच (५)',
      ta: 'ஐந்து (௫)',
    },
  },
  {
    name: 'call',
    detect: (lm, f) => {
      // Phone sign: thumb and pinky extended, others closed
      if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky) {
        return 0.85;
      }
      return 0;
    },
    translations: {
      en: 'Call / Phone',
      hi: 'फ़ोन करो',
      ta: 'அழைப்பு',
    },
  },
  {
    name: 'point',
    detect: (lm, f) => {
      // Pointing: only index extended
      if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb) {
        return 0.72;
      }
      return 0;
    },
    translations: {
      en: 'Point / This',
      hi: 'यह',
      ta: 'இது',
    },
  },
  {
    name: 'ok',
    detect: (lm, f) => {
      // OK sign: thumb and index form circle, others extended
      const thumbIndexDist = dist(lm, THUMB_TIP, INDEX_TIP);
      if (thumbIndexDist < 0.05 && f.middle && f.ring && f.pinky) {
        return 0.87;
      }
      return 0;
    },
    translations: {
      en: 'OK / Understood',
      hi: 'ठीक है',
      ta: 'சரி',
    },
  },
  {
    name: 'rock',
    detect: (lm, f) => {
      // Rock sign: index and pinky extended, others closed
      if (f.index && !f.middle && !f.ring && f.pinky && !f.thumb) {
        return 0.83;
      }
      return 0;
    },
    translations: {
      en: 'Rock On',
      hi: 'रॉक',
      ta: 'ராக்',
    },
  },
];

// Emergency signs
const EMERGENCY_SIGNS = new Set(['help', 'emergency', 'pain', 'danger', 'stop']);

/**
 * Temporal smoothing buffer for stable predictions
 */
class SignBuffer {
  constructor(windowSize = 8, threshold = 4) {
    this.buffer = [];
    this.windowSize = windowSize;
    this.threshold = threshold;
    this.lastEmitted = null;
    this.lastEmittedTime = 0;
    this.cooldownMs = 1500; // Don't emit same sign within 1.5s
  }

  push(sign, confidence) {
    this.buffer.push({ sign, confidence, time: Date.now() });
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
  }

  getStableSign() {
    if (this.buffer.length < this.threshold) return null;

    // Count occurrences of each sign in the buffer
    const counts = {};
    let totalConf = {};
    for (const entry of this.buffer) {
      if (!entry.sign) continue;
      counts[entry.sign] = (counts[entry.sign] || 0) + 1;
      totalConf[entry.sign] = (totalConf[entry.sign] || 0) + entry.confidence;
    }

    // Find the sign with the most occurrences
    let bestSign = null;
    let bestCount = 0;
    for (const [sign, count] of Object.entries(counts)) {
      if (count > bestCount) {
        bestCount = count;
        bestSign = sign;
      }
    }

    // Only emit if the sign has enough votes
    if (bestSign && bestCount >= this.threshold) {
      const now = Date.now();
      if (bestSign === this.lastEmitted && (now - this.lastEmittedTime) < this.cooldownMs) {
        return null; // Cooldown
      }
      const avgConf = totalConf[bestSign] / bestCount;
      this.lastEmitted = bestSign;
      this.lastEmittedTime = now;
      return { sign: bestSign, confidence: avgConf };
    }

    return null;
  }

  reset() {
    this.buffer = [];
    this.lastEmitted = null;
    this.lastEmittedTime = 0;
  }
}

/**
 * Main classifier function
 * @param {Array} landmarks - MediaPipe hand landmarks array (21 points)
 * @returns {{ sign: string, confidence: number, translations: object, isEmergency: boolean } | null}
 */
export function classifySign(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const fingers = getFingerStates(landmarks);
  const candidates = [];

  for (const signDef of ISL_SIGNS) {
    const conf = signDef.detect(landmarks, fingers);
    if (conf > 0.55) {
      candidates.push({ name: signDef.name, confidence: conf, translations: signDef.translations });
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  if (candidates.length === 0) return null;

  const best = candidates[0];
  const topK = candidates.slice(0, 3).map(c => ({ sign: c.name, confidence: c.confidence }));

  // Check if top two are close (ambiguous)
  const needsDisambiguation = candidates.length >= 2 &&
    (candidates[0].confidence - candidates[1].confidence) < 0.1;

  return {
    sign: best.name,
    confidence: best.confidence,
    translations: best.translations,
    isEmergency: EMERGENCY_SIGNS.has(best.name),
    fingerStates: fingers,
    top_k: topK,
    needsDisambiguation,
  };
}

/**
 * Classify from multi-hand landmarks (primary hand)
 */
export function classifyFromMultiHands(multiHandLandmarks, multiHandedness) {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) return null;

  // Use the first (dominant) hand
  const landmarks = multiHandLandmarks[0];
  return classifySign(landmarks);
}

export { SignBuffer, ISL_SIGNS, getFingerStates, countExtended };
export default classifySign;
