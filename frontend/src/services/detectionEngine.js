/**
 * Client-side ISL Detection Engine.
 * Combines MediaPipe hand detection + sign classification to provide
 * a complete detection pipeline running entirely in the browser.
 * 
 * This acts as a drop-in replacement for the backend WebSocket pipeline,
 * generating the same result format that the UI components expect.
 */

import { handDetector } from './handDetector';
import { classifyFromMultiHands, SignBuffer } from './signClassifier';

class ClientDetectionEngine {
  constructor() {
    this.isRunning = false;
    this.isInitialized = false;
    this.videoElement = null;
    this.intervalId = null;
    this.fps = 12; // detection FPS (lower than camera FPS to save CPU)
    this.frameCount = 0;
    this.signBuffer = new SignBuffer(8, 3);
    this.history = [];
    this._listeners = {};
    this._lastDetection = null;
    this._fpsCounter = 0;
    this._fpsTimer = null;
    this._currentFps = 0;
  }

  /**
   * Initialize the detection engine (loads MediaPipe model)
   */
  async initialize() {
    if (this.isInitialized) return;

    this._emit('status', { state: 'loading', message: 'Loading hand detection model...' });

    try {
      await handDetector.initialize();
      this.isInitialized = true;
      this._emit('status', { state: 'ready', message: 'Hand detection model loaded' });
    } catch (err) {
      this._emit('status', { state: 'error', message: `Failed to load model: ${err.message}` });
      throw err;
    }
  }

  /**
   * Start real-time detection on a video element
   */
  start(videoElement) {
    if (this.isRunning) return;
    if (!this.isInitialized) {
      console.warn('Detection engine not initialized');
      return;
    }

    this.videoElement = videoElement;
    this.isRunning = true;
    this.frameCount = 0;
    this.signBuffer.reset();

    // Set up result handler
    handDetector.onResults((results) => {
      this._processResults(results);
    });

    // Start detection loop
    this.intervalId = setInterval(() => {
      if (this.videoElement && this.isRunning) {
        handDetector.processFrame(this.videoElement);
      }
    }, 1000 / this.fps);

    // FPS counter
    this._fpsTimer = setInterval(() => {
      this._currentFps = this._fpsCounter;
      this._fpsCounter = 0;
    }, 1000);

    this._emit('started', {});
  }

  /**
   * Stop detection
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this._fpsTimer) {
      clearInterval(this._fpsTimer);
      this._fpsTimer = null;
    }
    this._currentFps = 0;
    this._fpsCounter = 0;
    this._emit('stopped', {});
  }

  /**
   * Process MediaPipe detection results
   */
  _processResults(results) {
    this.frameCount++;
    this._fpsCounter++;
    const t0 = performance.now();

    const hasHands = results.landmarks && results.landmarks.length > 0;
    let detectionStatus = 'idle';
    let gestureResult = null;
    let classifierResult = null;

    if (hasHands) {
      detectionStatus = 'detecting';

      // Classify the hand pose
      classifierResult = classifyFromMultiHands(results.landmarks, results.handedness);

      if (classifierResult && classifierResult.confidence > 0.6) {
        // Feed into temporal buffer
        this.signBuffer.push(classifierResult.sign, classifierResult.confidence);

        // Check for stable detection
        const stableSign = this.signBuffer.getStableSign();
        if (stableSign) {
          detectionStatus = 'recognized';
          gestureResult = {
            sign: stableSign.sign,
            confidence: stableSign.confidence,
            is_confident: true,
            needs_disambiguation: stableSign.confidence < 0.72,
            top_k: [{ sign: stableSign.sign, confidence: stableSign.confidence }],
          };
        }
      } else {
        this.signBuffer.push(null, 0);
      }
    } else {
      this.signBuffer.push(null, 0);
    }

    const latencyMs = performance.now() - t0;

    // Build result in the same format as the backend
    const result = {
      frame_id: this.frameCount,
      session_id: 'client-side',
      timestamp: Date.now() / 1000,
      hand_detected: hasHands,
      face_detected: false,
      detection_status: detectionStatus,
      demo_mode: false,
      pipeline_latency_ms: Math.round(latencyMs * 10) / 10,
      landmarks: results.landmarks, // Raw landmarks for overlay drawing
      handedness: results.handedness,
    };

    if (gestureResult) {
      result.gesture = gestureResult;

      // Add translations
      const signDef = classifierResult;
      if (signDef && signDef.translations) {
        result.translation = {
          texts: signDef.translations,
          emotion_applied: false,
          is_emergency: signDef.isEmergency || false,
        };
      }

      // Add to history
      this.history.push({
        sign: gestureResult.sign,
        confidence: gestureResult.confidence,
        timestamp: Date.now() / 1000,
        translations: signDef?.translations,
      });
      if (this.history.length > 100) {
        this.history = this.history.slice(-100);
      }
    }

    // Simulated emotion (neutral by default)
    result.emotion = {
      emotion: 'neutral',
      confidence: 0.9,
      probabilities: { neutral: 0.9, happiness: 0.05, sadness: 0.03, anger: 0.02 },
    };

    this._lastDetection = result;
    this._emit('result', result);

    // Emergency alert
    if (result.translation?.is_emergency) {
      this._emit('emergency', {
        sign: gestureResult.sign,
        text: result.translation.texts,
        confidence: gestureResult.confidence,
      });
    }
  }

  /**
   * Get current FPS
   */
  getFps() {
    return this._currentFps;
  }

  /**
   * Get last detection result
   */
  getLastResult() {
    return this._lastDetection;
  }

  /**
   * Event listener system
   */
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    };
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }

  /**
   * Reset detection state
   */
  reset() {
    this.signBuffer.reset();
    this._lastDetection = null;
    this.history = [];
  }

  /**
   * Release resources
   */
  release() {
    this.stop();
    handDetector.release();
    this.isInitialized = false;
  }
}

// Singleton
export const detectionEngine = new ClientDetectionEngine();
export default detectionEngine;
