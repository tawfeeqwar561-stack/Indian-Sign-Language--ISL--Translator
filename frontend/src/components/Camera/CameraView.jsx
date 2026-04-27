import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useCamera } from '../../hooks/useCamera';
import { detectionEngine } from '../../services/detectionEngine';
import './CameraView.css';

const CAMERA_FPS = 15;

// MediaPipe hand landmark connections for drawing
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],     // thumb
  [0,5],[5,6],[6,7],[7,8],     // index
  [0,9],[9,10],[10,11],[11,12], // middle
  [0,13],[13,14],[14,15],[15,16], // ring
  [0,17],[17,18],[18,19],[19,20], // pinky
  [5,9],[9,13],[13,17],         // palm
];

const CameraView = ({ sendFrame, isConnected, lastResult }) => {
  const overlayCanvasRef = useRef(null);
  const fps = useSelector((s) => s.translation.fps);
  const latency = useSelector((s) => s.translation.latency);
  const [modelStatus, setModelStatus] = useState('idle'); // idle, loading, ready, error
  const [detectionFps, setDetectionFps] = useState(0);
  const fpsIntervalRef = useRef(null);

  // Use client-side detection data if available, fallback to backend lastResult
  const detectionStatus = lastResult?.detection_status || 'idle';
  const handDetected = lastResult?.hand_detected || false;

  const onFrame = useCallback(
    (base64) => {
      if (isConnected) sendFrame(base64);
    },
    [isConnected, sendFrame]
  );

  const { videoRef, canvasRef, isActive, error, start: startCamera, stop: stopCamera, toggleFacing, facing } =
    useCamera(onFrame, CAMERA_FPS);

  // Initialize detection engine when component mounts
  useEffect(() => {
    let cancelled = false;
    const initEngine = async () => {
      try {
        setModelStatus('loading');
        await detectionEngine.initialize();
        if (!cancelled) setModelStatus('ready');
      } catch (err) {
        if (!cancelled) setModelStatus('error');
        console.error('Detection engine init failed:', err);
      }
    };
    initEngine();
    return () => { cancelled = true; };
  }, []);

  // Start/stop client-side detection when camera starts/stops
  useEffect(() => {
    if (isActive && modelStatus === 'ready' && videoRef.current) {
      // Small delay to ensure video stream is ready
      const timer = setTimeout(() => {
        detectionEngine.start(videoRef.current);
      }, 500);
      
      // Track FPS
      fpsIntervalRef.current = setInterval(() => {
        setDetectionFps(detectionEngine.getFps());
      }, 1000);

      return () => {
        clearTimeout(timer);
        detectionEngine.stop();
        if (fpsIntervalRef.current) {
          clearInterval(fpsIntervalRef.current);
        }
      };
    }
  }, [isActive, modelStatus, videoRef]);

  // Draw hand landmarks overlay
  useEffect(() => {
    if (!overlayCanvasRef.current) return;
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!video) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // Draw hand landmarks if available
    if (lastResult && lastResult.landmarks) {
      const isRecognized = detectionStatus === 'recognized';

      for (let handIdx = 0; handIdx < lastResult.landmarks.length; handIdx++) {
        const landmarks = lastResult.landmarks[handIdx];
        
        // Draw connections
        ctx.lineWidth = 3;
        for (const [start, end] of HAND_CONNECTIONS) {
          const x1 = landmarks[start].x * w;
          const y1 = landmarks[start].y * h;
          const x2 = landmarks[end].x * w;
          const y2 = landmarks[end].y * h;

          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          if (isRecognized) {
            gradient.addColorStop(0, 'rgba(52, 211, 153, 0.9)');
            gradient.addColorStop(1, 'rgba(45, 212, 191, 0.9)');
          } else {
            gradient.addColorStop(0, 'rgba(129, 140, 248, 0.8)');
            gradient.addColorStop(1, 'rgba(167, 139, 250, 0.8)');
          }
          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Draw landmarks
        for (let i = 0; i < landmarks.length; i++) {
          const x = landmarks[i].x * w;
          const y = landmarks[i].y * h;
          
          // Larger dots for fingertips
          const isTip = [4, 8, 12, 16, 20].includes(i);
          const radius = isTip ? 6 : 3.5;

          // Glow effect
          ctx.shadowColor = isRecognized ? 'rgba(52, 211, 153, 0.6)' : 'rgba(129, 140, 248, 0.6)';
          ctx.shadowBlur = isTip ? 12 : 6;

          ctx.fillStyle = isRecognized
            ? (isTip ? '#34d399' : 'rgba(52, 211, 153, 0.85)')
            : (isTip ? '#818cf8' : 'rgba(129, 140, 248, 0.85)');
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();

          // White center dot for tips
          if (isTip) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      }

      // Draw detection border
      if (handDetected) {
        ctx.strokeStyle = isRecognized ? 'rgba(52, 211, 153, 0.5)' : 'rgba(129, 140, 248, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash(isRecognized ? [] : [8, 4]);
        const m = 8;
        ctx.strokeRect(m, m, w - m * 2, h - m * 2);
        ctx.setLineDash([]);
      }

      // Status label at top
      if (handDetected) {
        const label = isRecognized
          ? `✓ ${lastResult.gesture?.sign?.replace(/_/g, ' ').toUpperCase() || 'Recognized'}`
          : '✋ Hand Detected';
        ctx.font = 'bold 14px Inter, system-ui, sans-serif';
        const tw = ctx.measureText(label).width;
        const labelX = w / 2 - tw / 2 - 14;
        const labelY = 16;

        // Background pill
        ctx.fillStyle = isRecognized ? 'rgba(52, 211, 153, 0.85)' : 'rgba(129, 140, 248, 0.85)';
        ctx.beginPath();
        ctx.roundRect(labelX, labelY, tw + 28, 32, 16);
        ctx.fill();

        // Text
        ctx.fillStyle = '#fff';
        ctx.fillText(label, w / 2 - tw / 2, labelY + 22);
      }

      // Confidence indicator at bottom
      if (isRecognized && lastResult.gesture) {
        const conf = Math.round(lastResult.gesture.confidence * 100);
        const barW = 200;
        const barH = 6;
        const barX = w / 2 - barW / 2;
        const barY = h - 30;

        // Bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 5);
        ctx.fill();

        // Bar fill
        const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW * conf / 100, 0);
        fillGrad.addColorStop(0, '#34d399');
        fillGrad.addColorStop(1, '#2dd4bf');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * conf / 100, barH, 3);
        ctx.fill();

        // Confidence text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.fillText(`${conf}%`, barX + barW + 8, barY + barH);
      }
    }
  }, [lastResult, videoRef, handDetected, detectionStatus]);

  const statusConfig = {
    idle:       { label: 'Waiting…', className: 'status-idle' },
    detecting:  { label: 'Detecting…', className: 'status-detecting' },
    recognized: { label: 'Recognized ✓', className: 'status-recognized' },
  };

  const status = statusConfig[detectionStatus] || statusConfig.idle;

  const handleStart = async () => {
    await startCamera();
  };

  const modelStatusBadge = {
    idle: { label: 'Not loaded', className: 'model-idle' },
    loading: { label: 'Loading AI…', className: 'model-loading' },
    ready: { label: 'AI Ready', className: 'model-ready' },
    error: { label: 'AI Error', className: 'model-error' },
  };

  const modelBadge = modelStatusBadge[modelStatus] || modelStatusBadge.idle;

  return (
    <div className={`camera-card glass-card ${isActive ? 'active' : ''}`}>
      <div className="card-header">
        <span className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          Camera Feed
        </span>
        <div className="camera-meta">
          <span className={`model-badge ${modelBadge.className}`}>
            {modelStatus === 'loading' && <span className="loading-spinner" />}
            {modelBadge.label}
          </span>
          {isActive && (
            <>
              <span className="meta-badge">{detectionFps || fps || 0} FPS</span>
              <span className="meta-badge">{(lastResult?.pipeline_latency_ms || latency || 0).toFixed(0)}ms</span>
              <span className={`status-badge ${status.className}`}>
                <span className="connection-dot" />
                {status.label}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="camera-viewport">
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <canvas ref={overlayCanvasRef} className="camera-overlay" />
        {isActive && <div className="scanning-line" />}

        {!isActive && (
          <div className="camera-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2, marginBottom: '16px' }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <h3 className="placeholder-title">Start Camera Feed</h3>
            <p className="placeholder-text">Enable your camera to begin real-time ISL recognition</p>
            {modelStatus === 'loading' && (
              <div className="model-loading-indicator">
                <div className="loading-spinner large" />
                <p>Loading AI models...</p>
              </div>
            )}
            {modelStatus === 'error' && (
              <p className="camera-error">⚠️ Failed to load AI model. Try refreshing the page.</p>
            )}
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStart}
              disabled={modelStatus === 'loading'}
              id="start-camera-btn"
            >
              {modelStatus === 'loading' ? '⏳ Loading…' : '▶ Start Camera'}
            </button>
            {error && <p className="camera-error">⚠️ {error}</p>}
          </div>
        )}

        {/* Hand detection guide overlay when no hand detected */}
        {isActive && !handDetected && modelStatus === 'ready' && (
          <div className="detection-guide">
            <div className="guide-frame">
              <div className="guide-corner tl" />
              <div className="guide-corner tr" />
              <div className="guide-corner bl" />
              <div className="guide-corner br" />
            </div>
            <p className="guide-text">Show your hand in the frame</p>
          </div>
        )}
      </div>

      <div className="camera-controls">
        {isActive ? (
          <>
            <button className="btn btn-danger" onClick={stopCamera} id="stop-camera-btn">
              ⏹ Stop
            </button>
            <button className="btn btn-ghost btn-sm" onClick={toggleFacing}>
              🔄 {facing === 'user' ? 'Front' : 'Rear'}
            </button>
            <div className="controls-spacer" />
            {handDetected && (
              <span className="hand-indicator animate-fade-in">
                ✋ <span className="hand-count">{lastResult?.landmarks?.length || 0} hand{(lastResult?.landmarks?.length || 0) !== 1 ? 's' : ''}</span>
              </span>
            )}
          </>
        ) : (
          <button className="btn btn-primary" onClick={handleStart} disabled={modelStatus === 'loading'} id="start-camera-btn-bottom">
            ▶ Start
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraView;