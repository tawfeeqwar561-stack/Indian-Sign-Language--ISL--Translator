import React, { useRef, useEffect } from 'react';
import { drawHandLandmarks } from '../../utils/mediapipeUtils';

const HandOverlay = ({ landmarks, width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    if (landmarks) {
      drawHandLandmarks(ctx, landmarks, width, height);
    }
  }, [landmarks, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

export default HandOverlay;