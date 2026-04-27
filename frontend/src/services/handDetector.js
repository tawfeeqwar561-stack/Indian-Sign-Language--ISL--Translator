/**
 * Client-side Hand Detection using MediaPipe Hands.
 * Runs entirely in the browser — no backend needed.
 * Provides real-time hand landmark detection from camera frames.
 */

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240';

class HandDetector {
  constructor() {
    this.hands = null;
    this.isLoaded = false;
    this.isLoading = false;
    this._onResults = null;
    this._lastLandmarks = null;
    this._lastHandedness = null;
  }

  async initialize() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;

    try {
      const { Hands } = await import('@mediapipe/hands');

      this.hands = new Hands({
        locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`,
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      this.hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          this._lastLandmarks = results.multiHandLandmarks;
          this._lastHandedness = results.multiHandedness || [];
        } else {
          this._lastLandmarks = null;
          this._lastHandedness = null;
        }
        if (this._onResults) {
          this._onResults({
            landmarks: this._lastLandmarks,
            handedness: this._lastHandedness,
            image: results.image,
          });
        }
      });

      // Warm up the model with a blank canvas
      const warmup = document.createElement('canvas');
      warmup.width = 10;
      warmup.height = 10;
      await this.hands.send({ image: warmup });

      this.isLoaded = true;
      this.isLoading = false;
      console.log('✅ MediaPipe Hands loaded successfully');
    } catch (err) {
      console.error('❌ MediaPipe Hands initialization failed:', err);
      this.isLoading = false;
      throw err;
    }
  }

  onResults(callback) {
    this._onResults = callback;
  }

  async processFrame(videoElement) {
    if (!this.hands || !this.isLoaded) return;
    if (!videoElement || videoElement.readyState < 2) return;

    try {
      await this.hands.send({ image: videoElement });
    } catch (err) {
      // Silently ignore frame errors (e.g., frame too small)
    }
  }

  getLastLandmarks() {
    return this._lastLandmarks;
  }

  getLastHandedness() {
    return this._lastHandedness;
  }

  release() {
    if (this.hands) {
      this.hands.close();
      this.hands = null;
      this.isLoaded = false;
    }
  }
}

// Singleton
export const handDetector = new HandDetector();
export default handDetector;
