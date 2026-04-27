import { useRef, useState, useCallback, useEffect } from 'react';

export function useCamera(onFrame, fps = 15) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const onFrameRef = useRef(onFrame);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facing, setFacing] = useState('user');

  // Keep onFrame ref current
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.7);
    if (onFrameRef.current) onFrameRef.current(base64);
  }, []);

  const start = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setError(null);

      // Start frame capture loop (for backend streaming)
      intervalRef.current = setInterval(() => {
        captureFrame();
      }, 1000 / fps);
    } catch (err) {
      setError(err.message);
      console.error('Camera error:', err);
    }
  }, [facing, fps, captureFrame]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  }, []);

  const toggleFacing = useCallback(() => {
    stop();
    setFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, [stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { videoRef, canvasRef, isActive, error, start, stop, toggleFacing, facing };
}