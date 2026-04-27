import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getSignAnimation, getRestPose } from '../../utils/signAnimations';
import './AvatarPanel.css';

/**
 * 3D-style Sign Language Avatar using Canvas 2D
 * Renders a procedural humanoid figure that animates ISL signs.
 * Uses smooth interpolation (LERP) between keyframe poses.
 */
const AvatarPanel = ({ lastResult }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const queueRef = useRef([]);
  const currentAnimRef = useRef(null);
  const currentFrameRef = useRef(0);
  const frameStartRef = useRef(0);
  const currentPoseRef = useRef(getRestPose());
  const targetPoseRef = useRef(getRestPose());
  const [currentSign, setCurrentSign] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const settings = useSelector((s) => s.settings);

  // Queue a new sign animation when a gesture is recognized
  useEffect(() => {
    if (lastResult?.gesture?.is_confident && lastResult.gesture.sign) {
      const sign = lastResult.gesture.sign;
      queueRef.current.push(sign);
    }
  }, [lastResult]);

  // Interpolation helper
  const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
  const lerpArray = (a, b, t) => a.map((v, i) => lerp(v, b[i] || 0, t));

  // Draw the humanoid figure
  const drawAvatar = useCallback((ctx, w, h, pose) => {
    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    bgGrad.addColorStop(0, 'rgba(129, 140, 248, 0.05)');
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Figure center
    const cx = w / 2;
    const cy = h * 0.35;
    const scale = Math.min(w, h) / 400;

    // Joint positions from pose data
    const getJoint = (name) => pose[name] || [0, 0, 0];

    const headR = getJoint('head');
    const spineR = getJoint('spine');
    const lsR = getJoint('leftShoulder');
    const leR = getJoint('leftElbow');
    const lwR = getJoint('leftWrist');
    const lfR = getJoint('leftFingers');
    const rsR = getJoint('rightShoulder');
    const reR = getJoint('rightElbow');
    const rwR = getJoint('rightWrist');
    const rfR = getJoint('rightFingers');

    // Convert rotations to 2D positions
    const armLen = 70 * scale;
    const forearmLen = 60 * scale;
    const handLen = 25 * scale;

    // Torso
    const spineOffset = spineR[1] * 20 * scale;
    const shoulderY = cy + 40 * scale;
    const hipY = shoulderY + 100 * scale;

    // Head
    const headX = cx + headR[1] * 15 * scale + spineOffset;
    const headY = cy - 10 * scale + headR[0] * 10 * scale;
    const headRadius = 22 * scale;

    // Shoulders
    const shoulderSpan = 50 * scale;
    const lShoulderX = cx - shoulderSpan + spineOffset;
    const rShoulderX = cx + shoulderSpan + spineOffset;
    const shoulderYAdj = shoulderY;

    // Left arm
    const lElbowX = lShoulderX + Math.sin(lsR[2]) * armLen + Math.sin(lsR[1]) * armLen * 0.3;
    const lElbowY = shoulderYAdj + Math.cos(lsR[2]) * armLen + lsR[0] * armLen * 0.5;
    const lWristX = lElbowX + Math.sin(lsR[2] + leR[2]) * forearmLen;
    const lWristY = lElbowY + Math.cos(lsR[2] + leR[2]) * forearmLen + leR[0] * forearmLen * 0.3;
    const lHandX = lWristX + Math.sin(lsR[2] + leR[2] + lwR[2]) * handLen;
    const lHandY = lWristY + Math.cos(lsR[2] + leR[2] + lwR[2]) * handLen + lwR[0] * handLen * 0.3;

    // Right arm
    const rElbowX = rShoulderX + Math.sin(rsR[2]) * armLen + Math.sin(rsR[1]) * armLen * 0.3;
    const rElbowY = shoulderYAdj + Math.cos(-rsR[2]) * armLen + rsR[0] * armLen * 0.5;
    const rWristX = rElbowX + Math.sin(rsR[2] + reR[2]) * forearmLen;
    const rWristY = rElbowY + Math.cos(-rsR[2] - reR[2]) * forearmLen + reR[0] * forearmLen * 0.3;
    const rHandX = rWristX + Math.sin(rsR[2] + reR[2] + rwR[2]) * handLen;
    const rHandY = rWristY + Math.cos(-rsR[2] - reR[2] - rwR[2]) * handLen + rwR[0] * handLen * 0.3;

    // Drawing style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Body glow
    ctx.shadowColor = 'rgba(129, 140, 248, 0.3)';
    ctx.shadowBlur = 15;

    // Torso
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)';
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(lShoulderX, shoulderYAdj);
    ctx.lineTo(rShoulderX, shoulderYAdj);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + spineOffset, shoulderYAdj);
    ctx.lineTo(cx + spineOffset, hipY);
    ctx.stroke();

    // Shoulders
    ctx.beginPath();
    ctx.moveTo(cx + spineOffset, shoulderYAdj);
    ctx.lineTo(cx + spineOffset, shoulderYAdj - 30 * scale);
    ctx.stroke();

    // Legs (static)
    const legSpan = 20 * scale;
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
    ctx.lineWidth = 3.5 * scale;
    ctx.beginPath();
    ctx.moveTo(cx + spineOffset - legSpan, hipY);
    ctx.lineTo(cx + spineOffset - legSpan - 5 * scale, hipY + 80 * scale);
    ctx.lineTo(cx + spineOffset - legSpan - 10 * scale, hipY + 160 * scale);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + spineOffset + legSpan, hipY);
    ctx.lineTo(cx + spineOffset + legSpan + 5 * scale, hipY + 80 * scale);
    ctx.lineTo(cx + spineOffset + legSpan + 10 * scale, hipY + 160 * scale);
    ctx.stroke();

    // Arms
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.7)';
    ctx.lineWidth = 3.5 * scale;

    // Left arm
    ctx.beginPath();
    ctx.moveTo(lShoulderX, shoulderYAdj);
    ctx.lineTo(lElbowX, lElbowY);
    ctx.lineTo(lWristX, lWristY);
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(rShoulderX, shoulderYAdj);
    ctx.lineTo(rElbowX, rElbowY);
    ctx.lineTo(rWristX, rWristY);
    ctx.stroke();

    // Hands (circles with finger indication)
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(129, 140, 248, 0.5)';

    const drawHand = (x, y, fingerRot, isLeft) => {
      const handSize = 8 * scale;
      // Palm
      ctx.fillStyle = 'rgba(167, 139, 250, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, handSize, 0, Math.PI * 2);
      ctx.fill();

      // Fingers
      const fingerLen = (12 + fingerRot[0] * 8) * scale;
      const dir = isLeft ? -1 : 1;
      for (let i = -2; i <= 2; i++) {
        const angle = (i * 0.25) + (isLeft ? Math.PI * 0.3 : -Math.PI * 0.3);
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.5)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.sin(angle) * fingerLen * dir,
          y - Math.cos(angle) * fingerLen
        );
        ctx.stroke();
      }
    };

    drawHand(lHandX, lHandY, lfR, true);
    drawHand(rHandX, rHandY, rfR, false);

    // Joints (dots)
    ctx.shadowBlur = 10;
    const joints = [
      [lShoulderX, shoulderYAdj], [lElbowX, lElbowY], [lWristX, lWristY],
      [rShoulderX, shoulderYAdj], [rElbowX, rElbowY], [rWristX, rWristY],
    ];
    joints.forEach(([jx, jy]) => {
      ctx.fillStyle = 'rgba(129, 140, 248, 0.9)';
      ctx.beginPath();
      ctx.arc(jx, jy, 3.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    });

    // Head
    ctx.shadowColor = 'rgba(129, 140, 248, 0.4)';
    ctx.shadowBlur = 25;
    const headGrad = ctx.createRadialGradient(headX, headY, 0, headX, headY, headRadius);
    headGrad.addColorStop(0, 'rgba(167, 139, 250, 0.5)');
    headGrad.addColorStop(1, 'rgba(129, 140, 248, 0.2)');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    ctx.shadowBlur = 0;
    const eyeOffsetX = 7 * scale;
    const eyeY = headY - 3 * scale;
    ctx.fillStyle = 'rgba(224, 224, 240, 0.8)';
    ctx.beginPath();
    ctx.arc(headX - eyeOffsetX, eyeY, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(headX + eyeOffsetX, eyeY, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = 'rgba(224, 224, 240, 0.4)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.arc(headX, headY + 7 * scale, 5 * scale, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let running = true;

    const animate = (timestamp) => {
      if (!running) return;

      const w = canvas.width;
      const h = canvas.height;

      // Check for queued animations
      if (!currentAnimRef.current && queueRef.current.length > 0) {
        const sign = queueRef.current.shift();
        currentAnimRef.current = getSignAnimation(sign);
        currentFrameRef.current = 0;
        frameStartRef.current = timestamp;
        setCurrentSign(sign);
        setIsPlaying(true);
        // Snapshot current pose as start
        currentPoseRef.current = { ...targetPoseRef.current };
        targetPoseRef.current = currentAnimRef.current[0]?.joints || getRestPose();
      }

      // Interpolate current animation
      if (currentAnimRef.current) {
        const anim = currentAnimRef.current;
        const frameIdx = currentFrameRef.current;

        if (frameIdx < anim.length) {
          const frameDuration = (anim[frameIdx].duration / speed) * 1000;
          const elapsed = timestamp - frameStartRef.current;
          const t = Math.min(1, elapsed / frameDuration);

          // Smooth ease
          const eased = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

          // Build interpolated pose
          const interpolated = {};
          const from = currentPoseRef.current;
          const to = targetPoseRef.current;
          for (const joint of Object.keys(getRestPose())) {
            interpolated[joint] = lerpArray(
              from[joint] || [0, 0, 0],
              to[joint] || [0, 0, 0],
              eased
            );
          }

          drawAvatar(ctx, w, h, interpolated);

          if (t >= 1) {
            // Move to next frame
            currentPoseRef.current = { ...targetPoseRef.current };
            currentFrameRef.current = frameIdx + 1;
            frameStartRef.current = timestamp;
            if (frameIdx + 1 < anim.length) {
              targetPoseRef.current = anim[frameIdx + 1].joints;
            }
          }
        } else {
          // Animation complete
          currentAnimRef.current = null;
          setIsPlaying(false);
          currentPoseRef.current = { ...targetPoseRef.current };
        }
      } else {
        // Idle — gentle breathing animation
        const breathe = Math.sin(timestamp / 2000) * 0.02;
        const idle = { ...getRestPose() };
        idle.spine = [breathe, 0, 0];
        idle.head = [breathe * 0.5, Math.sin(timestamp / 5000) * 0.02, 0];
        drawAvatar(ctx, w, h, idle);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    // Set canvas size
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resize();
    window.addEventListener('resize', resize);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [speed, drawAvatar, lerp, lerpArray]);

  const handleReplay = () => {
    if (currentSign) {
      queueRef.current.push(currentSign);
    }
  };

  return (
    <div className="avatar-card glass-card">
      <div className="card-header">
        <span className="card-title">
          <span className="icon">🧑‍🦱</span> Sign Avatar
        </span>
        <div className="avatar-meta">
          {isPlaying && (
            <span className="status-badge status-detecting">
              <span className="connection-dot" />
              Signing…
            </span>
          )}
          {currentSign && !isPlaying && (
            <span className="status-badge status-recognized">
              ✓ {currentSign.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      <div className="avatar-viewport">
        <canvas ref={canvasRef} className="avatar-canvas" />
        {!currentSign && !isPlaying && (
          <div className="avatar-hint">
            <p>Avatar will animate recognized signs</p>
          </div>
        )}
      </div>

      <div className="avatar-controls">
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleReplay}
          disabled={!currentSign}
          id="avatar-replay-btn"
        >
          🔄 Replay
        </button>
        <div className="speed-control">
          <label className="speed-label">Speed</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="speed-slider"
            id="avatar-speed-slider"
          />
          <span className="speed-value">{speed.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
};

export default AvatarPanel;
