/**
 * Hook for running MediaPipe Hands in the browser (optional client-side tracking).
 * This is an alternative to sending raw frames to the backend for preprocessing.
 */

import { useRef, useCallback, useState } from 'react';

export function useMediaPipe() {
  const handsRef = useRef(null);
  const [landmarks, setLandmarks] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const initialize = useCallback(async () => {
    try {
      const { Hands } = await import('@mediapipe/hands');
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          setLandmarks(results.multiHandLandmarks);
        } else {
          setLandmarks(null);
        }
      });

      handsRef.current = hands;
      setIsLoaded(true);
    } catch (err) {
      console.error('MediaPipe init error:', err);
    }
  }, []);

  const processFrame = useCallback(async (videoElement) => {
    if (handsRef.current && videoElement) {
      await handsRef.current.send({ image: videoElement });
    }
  }, []);

  return { initialize, processFrame, landmarks, isLoaded };
}