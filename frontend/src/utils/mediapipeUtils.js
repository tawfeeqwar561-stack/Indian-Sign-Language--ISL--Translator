/**
 * AR Overlay drawing utilities.
 * Called from CameraView to render hand landmarks, emotion labels, etc.
 */

export function drawAROverlay(ctx, result, width, height) {
  if (!ctx || !result) return;
  ctx.clearRect(0, 0, width, height);
  // The CameraView component now handles its own overlay drawing.
  // This file is kept for future MediaPipe landmark visualization.
}

export function drawHandLandmarks(ctx, landmarks, color = '#818cf8') {
  if (!ctx || !landmarks || !Array.isArray(landmarks)) return;

  const connections = [
    [0,1],[1,2],[2,3],[3,4],     // thumb
    [0,5],[5,6],[6,7],[7,8],     // index
    [5,9],[9,10],[10,11],[11,12], // middle
    [9,13],[13,14],[14,15],[15,16], // ring
    [13,17],[0,17],[17,18],[18,19],[19,20], // pinky
  ];

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  connections.forEach(([a, b]) => {
    if (landmarks[a] && landmarks[b]) {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x, landmarks[a].y);
      ctx.lineTo(landmarks[b].x, landmarks[b].y);
      ctx.stroke();
    }
  });

  landmarks.forEach((lm) => {
    if (!lm) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lm.x, lm.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}