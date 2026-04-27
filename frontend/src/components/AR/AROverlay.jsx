import React, { useRef, useEffect } from 'react';
import { drawAROverlay } from '../../utils/mediapipeUtils';
import './AROverlay.css';

const AROverlay = ({ result, width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawAROverlay(ctx, result, width, height);
  }, [result, width, height]);

  return (
    <div className="ar-overlay-container">
      <canvas ref={canvasRef} className="ar-canvas" />
      {result && result.translation && result.translation.is_emergency && (
        <div className="ar-emergency-banner">
          ⚠️ EMERGENCY DETECTED — SEEKING HELP
        </div>
      )}
    </div>
  );
};

export default AROverlay;