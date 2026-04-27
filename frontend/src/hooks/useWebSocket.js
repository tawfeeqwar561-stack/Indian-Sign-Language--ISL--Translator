import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { wsService } from '../services/websocket';
import { setLastResult, setFps } from '../store/slices/translationSlice';
import { setEmotion } from '../store/slices/emotionSlice';
import { detectionEngine } from '../services/detectionEngine';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [lastResult, setLastResultLocal] = useState(null);
  const dispatch = useDispatch();
  const settings = useSelector((s) => s.settings);
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef(null);

  useEffect(() => {
    // Try connecting to backend (non-blocking — won't break the app if backend is down)
    try {
      wsService.connect();
    } catch (e) {
      console.warn('Backend WebSocket unavailable, running in client-only mode');
    }

    const unsubs = [
      wsService.on('connectionChange', (connected) => setIsConnected(connected)),
      wsService.on('sessionStart', (data) => setSessionId(data.session_id)),
      wsService.on('result', (data) => {
        setLastResultLocal(data);
        dispatch(setLastResult(data));
        if (data.emotion) {
          dispatch(setEmotion({
            emotion: data.emotion.emotion,
            confidence: data.emotion.confidence,
            probabilities: data.emotion.probabilities,
          }));
        }
        frameCountRef.current += 1;
      }),
    ];

    // Also listen for client-side detection results and dispatch to Redux
    const clientUnsub = detectionEngine.on('result', (data) => {
      if (data.gesture && data.gesture.is_confident) {
        dispatch(setLastResult(data));
      }
      if (data.emotion) {
        dispatch(setEmotion({
          emotion: data.emotion.emotion,
          confidence: data.emotion.confidence,
          probabilities: data.emotion.probabilities,
        }));
      }
    });

    // FPS counter
    fpsTimerRef.current = setInterval(() => {
      dispatch(setFps(frameCountRef.current));
      frameCountRef.current = 0;
    }, 1000);

    return () => {
      unsubs.forEach((u) => u());
      clientUnsub();
      clearInterval(fpsTimerRef.current);
      try {
        wsService.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    };
  }, [dispatch]);

  const sendFrame = useCallback((base64) => wsService.sendFrame(base64), []);
  const sendTextInput = useCallback((text) => wsService.sendTextInput(text, settings.language), [settings.language]);
  const sendReset = useCallback(() => wsService.reset(), []);
  const configure = useCallback((cfg) => wsService.configure(cfg), []);

  return { isConnected, sessionId, lastResult, sendFrame, sendTextInput, sendReset, configure };
}