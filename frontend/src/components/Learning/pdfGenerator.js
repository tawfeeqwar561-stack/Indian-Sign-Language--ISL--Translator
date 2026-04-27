/**
 * ISL PDF Generator — generates learning PDFs entirely client-side.
 * Loads jsPDF from CDN on first use so no npm install is required.
 */

/* ── Load jsPDF from CDN lazily ─────────────────────────── */
let jsPDFClass = null;

async function loadJsPDF() {
  if (jsPDFClass) return jsPDFClass;
  if (window.jspdf?.jsPDF) {
    jsPDFClass = window.jspdf.jsPDF;
    return jsPDFClass;
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => {
      jsPDFClass = window.jspdf.jsPDF;
      resolve(jsPDFClass);
    };
    s.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
    document.head.appendChild(s);
  });
}

/* ── Helpers ─────────────────────────────────────────────── */
function addHeader(doc, title) {
  doc.setFillColor(30, 39, 73);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 105, 18, { align: 'center' });
  doc.setTextColor(40, 40, 40);
}

function addFooter(doc) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`ISL Learning Platform — Page ${i} of ${pages}`, 105, 290, { align: 'center' });
  }
}

function addTitlePage(doc, title, subtitle) {
  doc.setFillColor(30, 39, 73);
  doc.rect(0, 0, 210, 297, 'F');
  // Accent bar
  doc.setFillColor(124, 77, 255);
  doc.rect(0, 110, 210, 6, 'F');
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 105, 140, { align: 'center' });
  // Subtitle
  doc.setFontSize(14);
  doc.setTextColor(180, 180, 220);
  doc.text(subtitle, 105, 158, { align: 'center' });
  // Footer
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 160);
  doc.text('ISL Translation System — Learning Platform', 105, 250, { align: 'center' });
}

function addChapter(doc, title, y) {
  if (y > 260) { doc.addPage(); y = 35; }
  doc.setFillColor(41, 128, 185);
  doc.rect(14, y - 6, 182, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 18, y + 1);
  doc.setTextColor(40, 40, 40);
  return y + 14;
}

function addSection(doc, title, body, y) {
  if (y > 260) { doc.addPage(); y = 35; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(41, 128, 185);
  doc.text(title, 18, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(body, 170);
  for (const line of lines) {
    if (y > 278) { doc.addPage(); addHeader(doc, 'ISL Learning Resource'); y = 35; }
    doc.text(line, 18, y);
    y += 5;
  }
  return y + 4;
}

function addBody(doc, body, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(body, 170);
  for (const line of lines) {
    if (y > 278) { doc.addPage(); addHeader(doc, 'ISL Learning Resource'); y = 35; }
    doc.text(line, 18, y);
    y += 5;
  }
  return y + 4;
}

/* ═══════════════════════════════════════════════════════════ */
/*  PDF Content Generators                                     */
/* ═══════════════════════════════════════════════════════════ */

function genAlphabet(JPDF) {
  const doc = new JPDF();
  addTitlePage(doc, 'ISL Alphabet Guide', 'Beginner Level — Finger Spelling A–Z');

  doc.addPage();
  addHeader(doc, 'ISL Alphabet Guide');
  let y = 38;
  y = addChapter(doc, 'Introduction to ISL Finger Spelling', y);
  y = addBody(doc,
    'Indian Sign Language (ISL) uses a one-handed finger-spelling system to represent the 26 letters of the English alphabet. ' +
    'Finger spelling is essential for spelling names, places, and words that do not have a dedicated sign.\n\n' +
    'Key principles:\n' +
    '• Use your dominant hand consistently\n' +
    '• Keep your hand at shoulder height\n' +
    '• Face your palm toward the viewer\n' +
    '• Maintain a steady pace when spelling words', y);

  const letters = {
    A: 'Make a fist with thumb resting on the side of the index finger.',
    B: 'Hold all four fingers straight up, together, with thumb tucked across palm.',
    C: 'Curve all fingers and thumb into a C shape, like holding a cup.',
    D: 'Index finger points up, other fingers curl to touch thumb tip forming a circle.',
    E: 'Curl all fingers down, thumb tucked under fingertips.',
    F: 'Touch index finger tip to thumb tip forming a circle, other fingers straight up.',
    G: 'Index finger and thumb point sideways, parallel to each other, other fingers curled.',
    H: 'Index and middle fingers extend sideways together, other fingers curled.',
    I: 'Make a fist with pinky finger extended straight up.',
    J: 'Start with I handshape, trace a J motion downward with the pinky.',
    K: 'Index finger up, middle finger angled forward, thumb between them.',
    L: 'Index finger points up, thumb extends sideways forming an L shape.',
    M: 'Three fingers (index, middle, ring) draped over thumb, fist closed.',
    N: 'Two fingers (index, middle) draped over thumb, fist closed.',
    O: 'All fingertips touch thumb tip forming an O/circle shape.',
    P: 'Similar to K but hand points downward at an angle.',
    Q: 'Similar to G but hand points downward.',
    R: 'Cross index and middle fingers, other fingers curled.',
    S: 'Make a fist with thumb wrapped over the front of fingers.',
    T: 'Thumb tucked between index and middle fingers in a fist.',
    U: 'Index and middle fingers point up together, other fingers curled.',
    V: 'Index and middle fingers spread apart in a V, other fingers curled.',
    W: 'Index, middle, and ring fingers spread apart pointing up, pinky curled.',
    X: 'Index finger hooks/bends at first knuckle, other fingers in fist.',
    Y: 'Thumb and pinky extend outward, other three fingers curled.',
    Z: 'Index finger traces a Z shape in the air.',
  };

  doc.addPage();
  addHeader(doc, 'ISL Alphabet Guide');
  y = 38;
  y = addChapter(doc, 'The ISL Alphabet A–M', y);
  for (const ch of 'ABCDEFGHIJKLM') y = addSection(doc, `Letter ${ch}`, letters[ch], y);

  doc.addPage();
  addHeader(doc, 'ISL Alphabet Guide');
  y = 38;
  y = addChapter(doc, 'The ISL Alphabet N–Z', y);
  for (const ch of 'NOPQRSTUVWXYZ') y = addSection(doc, `Letter ${ch}`, letters[ch], y);

  doc.addPage();
  addHeader(doc, 'ISL Alphabet Guide');
  y = 38;
  y = addChapter(doc, 'Practice Tips', y);
  y = addBody(doc,
    '1. Practice each letter for 5 minutes daily.\n' +
    '2. Spell common words: your name, city, everyday objects.\n' +
    '3. Practice in front of a mirror to check hand orientation.\n' +
    '4. Use the AI Practice mode in this app to get real-time feedback.\n' +
    '5. Speed will come naturally — focus on accuracy first.', y);

  addFooter(doc);
  return doc;
}

function genNumbers(JPDF) {
  const doc = new JPDF();
  addTitlePage(doc, 'ISL Numbers & Counting', 'Beginner Level — Numbers 1–100');

  doc.addPage();
  addHeader(doc, 'ISL Numbers & Counting');
  let y = 38;
  y = addChapter(doc, 'Counting in ISL', y);
  y = addBody(doc,
    'ISL uses specific hand shapes for numbers. Numbers 1–5 use extended fingers, ' +
    'while higher numbers combine movements and orientations.\n\n' +
    'Numbers are fundamental for everyday communication: telling time, prices, addresses, phone numbers, and quantities.', y);

  const nums = [
    ['1', 'Extend index finger upward, all other fingers curled into fist.'],
    ['2', 'Extend index and middle fingers upward in a V shape.'],
    ['3', 'Extend index, middle, and ring fingers upward.'],
    ['4', 'Extend all four fingers (not thumb) upward, spread slightly.'],
    ['5', 'Open hand with all five fingers spread apart.'],
    ['6', 'Touch pinky tip to thumb tip, other three fingers extended.'],
    ['7', 'Touch ring finger tip to thumb tip, other fingers extended.'],
    ['8', 'Touch middle finger tip to thumb tip, other fingers extended.'],
    ['9', 'Touch index finger tip to thumb tip, other fingers extended.'],
    ['10', 'Shake a thumbs-up hand or flick thumb off index finger.'],
  ];

  y = addChapter(doc, 'Numbers 1–10', y);
  for (const [n, desc] of nums) y = addSection(doc, `Number ${n}`, desc, y);

  doc.addPage();
  addHeader(doc, 'ISL Numbers & Counting');
  y = 38;
  y = addChapter(doc, 'Numbers 11–20', y);
  y = addBody(doc,
    '11–19: Sign the digit (1–9) and then add a twist of the wrist.\n' +
    '20: Touch index and thumb together twice, or sign 2 then 0.\n\n' +
    'Common usage: Age, time (hours), dates.', y);

  y = addChapter(doc, 'Tens (10–100)', y);
  y = addBody(doc,
    'Multiples of ten typically combine the digit with a specific movement:\n' +
    '• 20: Sign 2 + 0     • 30: Sign 3 + 0\n' +
    '• 40: Sign 4 + 0     • 50: Sign 5 + 0\n' +
    '• 60–90: Follow the same pattern\n' +
    '• 100: Sign 1 then C handshape\n\n' +
    'For compound numbers like 45, sign 4 then 5.', y);

  y = addChapter(doc, 'Practice Exercises', y);
  y = addBody(doc,
    '1. Sign your phone number.\n' +
    '2. Sign today\'s date (day, month, year).\n' +
    '3. Practice counting from 1 to 20 smoothly.\n' +
    '4. Sign prices at a store (e.g., Rs. 150, Rs. 75).\n' +
    '5. Tell your age and birth year in ISL.', y);

  addFooter(doc);
  return doc;
}

function genPhrases(JPDF) {
  const doc = new JPDF();
  addTitlePage(doc, 'ISL Common Phrases', 'Intermediate Level — Everyday Communication');

  doc.addPage();
  addHeader(doc, 'ISL Common Phrases');
  let y = 38;
  y = addChapter(doc, 'Introduction', y);
  y = addBody(doc,
    'This guide covers essential everyday phrases in ISL. Unlike spoken languages, ISL uses facial expressions ' +
    'and body language as grammatical markers. A questioning facial expression replaces a question mark; raised ' +
    'eyebrows indicate yes/no questions while furrowed brows indicate wh-questions.', y);

  const greetings = [
    ['Hello / Namaste', 'Both palms together at chest level, slight bow of the head.'],
    ['Good Morning', 'Sign "good" (thumbs up) + "morning" (flat hand rises like the sun from below chin upward).'],
    ['Good Night', 'Sign "good" (thumbs up) + "night" (dominant hand arcs downward over non-dominant flat hand).'],
    ['Thank You', 'Touch fingertips to chin, then move hand forward and slightly down, palm up.'],
    ['Sorry / Excuse Me', 'Make a fist and rub it in a circular motion on your chest.'],
    ['Please', 'Open palm on chest, circular motion.'],
    ['How are you?', 'Point to person, then both thumbs up with questioning expression.'],
    ['I am fine', 'Touch chest (I), then thumbs up (fine/good).'],
    ['My name is...', 'Touch chest (my), then finger-spell your name.'],
    ['Nice to meet you', 'Sign "nice" + point to other person + clasp hands together.'],
  ];

  y = addChapter(doc, 'Greetings & Pleasantries', y);
  for (const [phrase, desc] of greetings) y = addSection(doc, phrase, desc, y);

  doc.addPage();
  addHeader(doc, 'ISL Common Phrases');
  y = 38;
  const questions = [
    ['What is your name?', 'Point (you) + name sign (tap index and middle on forehead) + questioning face.'],
    ['Where do you live?', 'Sign "where" (wave index finger side to side) + "you" + "live" (both hands move up torso).'],
    ['What time is it?', 'Tap wrist (time) + questioning facial expression.'],
    ['How much does it cost?', 'Rub thumb across fingertips (money) + questioning expression.'],
  ];

  y = addChapter(doc, 'Common Questions', y);
  for (const [phrase, desc] of questions) y = addSection(doc, phrase, desc, y);

  y = addChapter(doc, 'ISL Grammar Basics', y);
  y = addBody(doc,
    'Key differences from spoken language:\n\n' +
    '1. Word Order: ISL typically follows Subject-Object-Verb (SOV) order.\n' +
    '   English: "I eat food" → ISL: "I food eat"\n\n' +
    '2. Facial Expressions: These are grammatical, not optional.\n' +
    '   • Yes/No questions: raised eyebrows\n' +
    '   • Wh-questions: furrowed brows\n' +
    '   • Negation: head shake while signing\n\n' +
    '3. Spatial Grammar: Signs are placed in space to indicate relationships.\n\n' +
    '4. Non-manual Signals: Head movements, eye gaze, mouth patterns.', y);

  addFooter(doc);
  return doc;
}

function genGrammar(JPDF) {
  const doc = new JPDF();
  addTitlePage(doc, 'ISL Grammar & Sentence Structure', 'Intermediate Level');

  doc.addPage();
  addHeader(doc, 'ISL Grammar');
  let y = 38;
  y = addChapter(doc, 'ISL Sentence Structure', y);
  y = addBody(doc,
    'ISL follows a distinct grammatical structure different from spoken Hindi or English.\n\n' +
    'Basic structure: TOPIC – COMMENT\n' +
    'Time indicators come first, followed by the subject, object, and verb.\n\n' +
    'Example:\n' +
    'English: "Yesterday I went to the market"\n' +
    'ISL: "YESTERDAY MARKET I GO" (Time-Object-Subject-Verb)', y);

  y = addChapter(doc, 'Verb Types in ISL', y);
  y = addBody(doc,
    '1. Plain Verbs: Do not change based on subject/object (e.g., KNOW, LIKE, WANT)\n\n' +
    '2. Directional Verbs: Move between subject and object locations in signing space ' +
    '(e.g., GIVE moves from giver to receiver, ASK, TELL, SHOW)\n\n' +
    '3. Spatial Verbs: Incorporate location information (e.g., PUT, MOVE)', y);

  y = addChapter(doc, 'Negation', y);
  y = addBody(doc,
    'Methods of negation in ISL:\n\n' +
    '1. Head shake while signing the verb\n' +
    '2. Adding NOT sign after the verb\n' +
    '3. Using specific negative signs: NOTHING, NEVER, NONE\n\n' +
    'Example: "I don\'t understand" → "I UNDERSTAND" + head shake', y);

  y = addChapter(doc, 'Classifiers', y);
  y = addBody(doc,
    'Classifiers are handshapes that represent categories of objects:\n\n' +
    '• Flat hand (B): vehicles, surfaces, paper\n' +
    '• Index finger (1): people standing, thin objects\n' +
    '• Curved hand (C): cylindrical objects, cups\n' +
    '• V handshape: people sitting, animals\n' +
    '• Fist (S): holding objects\n\n' +
    'Classifiers are used to show movement, location, and interaction of objects.', y);

  addFooter(doc);
  return doc;
}

function genAdvanced(JPDF) {
  const doc = new JPDF();
  addTitlePage(doc, 'Advanced ISL Conversation', 'Advanced Level — Fluency & Expression');

  doc.addPage();
  addHeader(doc, 'Advanced ISL');
  let y = 38;
  y = addChapter(doc, 'Advanced Discourse', y);
  y = addBody(doc,
    'At the advanced level, fluency requires mastering:\n\n' +
    '1. Role shifting — taking on different characters in a narrative\n' +
    '2. Constructed dialogue — showing what someone said vs. narrating\n' +
    '3. Spatial reference maintenance — keeping track of established referents\n' +
    '4. Register variation — formal vs. informal signing\n' +
    '5. Emotional prosody through non-manual features', y);

  y = addChapter(doc, 'Role Shifting', y);
  y = addBody(doc,
    'Role shifting allows a signer to take on the perspective of different people:\n\n' +
    '• Shift your body, head, and eye gaze to indicate a change in speaker\n' +
    '• Each character occupies a specific spatial location\n' +
    '• Facial expressions match the character\'s emotions\n' +
    '• Return to neutral position for narrator perspective\n\n' +
    'Practice: Tell a story involving two people having a disagreement, shifting between their perspectives.', y);

  y = addChapter(doc, 'Regional Variations in India', y);
  y = addBody(doc,
    '• Mumbai, Delhi, Kolkata, and Chennai have notable dialect differences\n' +
    '• Some signs differ completely between regions\n' +
    '• School-based sign systems influence local variants\n' +
    '• Understanding multiple variants improves comprehension\n\n' +
    'Tip: When communicating with signers from different regions, be prepared to negotiate meaning.', y);

  doc.addPage();
  addHeader(doc, 'Advanced ISL');
  y = 38;
  y = addChapter(doc, 'Professional & Academic Signing', y);
  y = addBody(doc,
    'Specialized vocabulary for professional contexts:\n\n' +
    '• Medical: Common medical terms, body parts, symptoms\n' +
    '• Legal: Rights, laws, court proceedings\n' +
    '• Technology: Computer terms, internet, social media\n' +
    '• Education: Academic subjects, classroom vocabulary\n\n' +
    'Many technical terms are finger-spelled or use initialized signs.', y);

  y = addChapter(doc, 'Deaf Culture & Etiquette', y);
  y = addBody(doc,
    'Understanding Deaf culture is essential:\n\n' +
    '1. Get attention properly: tap shoulder, wave, flash lights\n' +
    '2. Maintain eye contact during conversation\n' +
    '3. Do not walk between two people signing\n' +
    '4. Be patient — do not rush the signer\n' +
    '5. Ask permission before interpreting for someone\n' +
    '6. "Deaf" is not a negative term in the community\n' +
    '7. Respect that ISL is a complete, independent language', y);

  addFooter(doc);
  return doc;
}

function genDictionary(JPDF) {
  const doc = new JPDF();
  addTitlePage(doc, 'ISL Reference Dictionary', 'Comprehensive Sign Reference');

  const categories = {
    Family: [
      ['Mother', 'Tap thumb on chin twice with open hand.'],
      ['Father', 'Tap thumb on forehead twice with open hand.'],
      ['Brother', 'Sign MALE + point index fingers together sideways.'],
      ['Sister', 'Sign FEMALE + point index fingers together sideways.'],
      ['Child', 'Lower flat hand indicating height.'],
      ['Family', 'Both hands make F shapes, circle outward to form a circle.'],
    ],
    'Food & Drink': [
      ['Water', 'W handshape taps chin.'],
      ['Food / Eat', 'Bring bunched fingertips to mouth repeatedly.'],
      ['Tea', 'Mime dipping a tea bag in a cup.'],
      ['Rice', 'Scoop motion with cupped hand toward mouth.'],
      ['Milk', 'Squeeze motion with fist (milking).'],
    ],
    Colors: [
      ['Red', 'Stroke index finger down lips.'],
      ['Blue', 'B handshape shakes slightly.'],
      ['Green', 'G handshape twists at wrist.'],
      ['Yellow', 'Y handshape shakes at side.'],
      ['White', 'Pull hand away from chest, closing fingers.'],
      ['Black', 'Draw index finger across forehead.'],
    ],
    Emotions: [
      ['Happy', 'Brush chest upward with flat hand, smiling face.'],
      ['Sad', 'Both hands slide down face with sad expression.'],
      ['Angry', 'Claw hand pulls away from face with furrowed brows.'],
      ['Scared', 'Both fists open suddenly in front of chest, fearful expression.'],
      ['Surprised', 'Both hands open near eyes, wide-eyed expression.'],
      ['Love', 'Cross arms over chest in a hugging motion.'],
    ],
    'Daily Activities': [
      ['Work', 'S handshapes tap together at wrists.'],
      ['Sleep', 'Open hand slides down face while closing eyes.'],
      ['Study', 'Wiggle fingers of one hand toward open palm.'],
      ['Go', 'Both index fingers point and arc forward.'],
      ['Come', 'Beckon with index finger toward yourself.'],
    ],
    'Places & Travel': [
      ['Home', 'Bunched fingertips touch cheek then chin.'],
      ['School', 'Clap hands twice horizontally.'],
      ['Hospital', 'Draw a cross on upper arm with index finger.'],
      ['Market/Shop', 'Mime handing over money or pointing to shelves.'],
      ['Bus/Train', 'Mime holding steering wheel or pulling a chain.'],
    ],
  };

  for (const [cat, signs] of Object.entries(categories)) {
    doc.addPage();
    addHeader(doc, 'ISL Dictionary');
    let y = 38;
    y = addChapter(doc, cat, y);
    for (const [name, desc] of signs) y = addSection(doc, name, desc, y);
  }

  addFooter(doc);
  return doc;
}

function genExercises(JPDF) {
  const doc = new JPDF();
  addTitlePage(doc, 'ISL Practice Exercises', 'All Levels — Workbook');

  doc.addPage();
  addHeader(doc, 'ISL Practice Exercises');
  let y = 38;
  y = addChapter(doc, 'Beginner Exercises', y);
  y = addBody(doc,
    'Exercise 1: Finger Spell Your Name\n' +
    'Practice spelling your full name smoothly without pausing between letters.\n\n' +
    'Exercise 2: Number Drill\n' +
    'Sign numbers 1–20, then random numbers a partner calls out.\n\n' +
    'Exercise 3: Alphabet Speed Run\n' +
    'Sign A–Z as fast as possible while maintaining clarity. Target: under 30 seconds.\n\n' +
    'Exercise 4: Self-Introduction\n' +
    'Sign: My name is ___. I am ___ years old. I live in ___. Nice to meet you.', y);

  y = addChapter(doc, 'Intermediate Exercises', y);
  y = addBody(doc,
    'Exercise 5: Daily Routine\n' +
    'Describe your morning routine using at least 10 signs and proper time markers.\n\n' +
    'Exercise 6: Giving Directions\n' +
    'Explain how to get from your home to school/work using spatial classifiers.\n\n' +
    'Exercise 7: Question Practice\n' +
    'Ask and answer 5 wh-questions and 5 yes/no questions with proper facial grammar.\n\n' +
    'Exercise 8: Story Retelling\n' +
    'Watch a short video clip and retell the story in ISL to a partner.', y);

  doc.addPage();
  addHeader(doc, 'ISL Practice Exercises');
  y = 38;
  y = addChapter(doc, 'Advanced Exercises', y);
  y = addBody(doc,
    'Exercise 9: Role Shift Narrative\n' +
    'Tell a story with at least 3 characters, using role shifting for each.\n\n' +
    'Exercise 10: Debate\n' +
    'Pick a topic and present arguments for and against using formal register.\n\n' +
    'Exercise 11: Simultaneous Interpretation\n' +
    'Have someone read a news article; sign it simultaneously.\n\n' +
    'Exercise 12: Free Conversation\n' +
    'Have a 10-minute natural conversation with another signer on any topic.', y);

  addFooter(doc);
  return doc;
}

/* ═══════════════════════════════════════════════════════════ */
/*  Public API                                                 */
/* ═══════════════════════════════════════════════════════════ */

export const PDF_CATALOG = [
  { id: 'isl_alphabet_beginner', title: 'ISL Alphabet Guide', level: 'Beginner', gen: genAlphabet },
  { id: 'isl_numbers_beginner', title: 'Numbers & Counting', level: 'Beginner', gen: genNumbers },
  { id: 'isl_phrases_intermediate', title: 'Common Phrases', level: 'Intermediate', gen: genPhrases },
  { id: 'isl_grammar_intermediate', title: 'Grammar & Sentence Structure', level: 'Intermediate', gen: genGrammar },
  { id: 'isl_advanced_conversation', title: 'Advanced Conversation', level: 'Advanced', gen: genAdvanced },
  { id: 'isl_dictionary_reference', title: 'ISL Reference Dictionary', level: 'All Levels', gen: genDictionary },
  { id: 'isl_practice_exercises', title: 'Practice Exercises Workbook', level: 'All Levels', gen: genExercises },
];

/**
 * Generate and download a single PDF.
 * @param {string} pdfId — one of the IDs in PDF_CATALOG
 * @param {'download'|'view'} mode
 */
export async function generateAndDownloadPdf(pdfId, mode = 'download') {
  const JPDF = await loadJsPDF();
  const entry = PDF_CATALOG.find(p => p.id === pdfId);
  if (!entry) throw new Error(`Unknown PDF: ${pdfId}`);

  const doc = entry.gen(JPDF);
  const filename = `${pdfId}.pdf`;

  if (mode === 'view') {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } else {
    doc.save(filename);
  }
}
