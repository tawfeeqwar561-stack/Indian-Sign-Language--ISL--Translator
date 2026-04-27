/**
 * Sign Animation Keyframe Data for ISL Avatar
 *
 * Each sign maps to an array of keyframes. Each keyframe defines
 * joint rotations (in radians) and a duration (in seconds).
 *
 * Joint names: leftShoulder, leftElbow, leftWrist, leftFingers,
 *              rightShoulder, rightElbow, rightWrist, rightFingers,
 *              head, spine
 *
 * Format: { joints: { jointName: [rx, ry, rz] }, duration: seconds }
 */

const REST_POSE = {
  leftShoulder: [0, 0, 0.4],
  leftElbow: [0, 0, 0.3],
  leftWrist: [0, 0, 0],
  leftFingers: [0, 0, 0],
  rightShoulder: [0, 0, -0.4],
  rightElbow: [0, 0, -0.3],
  rightWrist: [0, 0, 0],
  rightFingers: [0, 0, 0],
  head: [0, 0, 0],
  spine: [0, 0, 0],
};

function pose(overrides, duration = 0.5) {
  return { joints: { ...REST_POSE, ...overrides }, duration };
}

const SIGN_ANIMATIONS = {
  hello: [
    pose({ rightShoulder: [-0.8, 0, -1.2], rightElbow: [-0.3, 0, -0.5], rightWrist: [0, 0, 0.3] }, 0.4),
    pose({ rightShoulder: [-0.8, 0, -1.2], rightElbow: [-0.3, 0, -0.5], rightWrist: [0, 0, -0.3] }, 0.3),
    pose({ rightShoulder: [-0.8, 0, -1.2], rightElbow: [-0.3, 0, -0.5], rightWrist: [0, 0, 0.3] }, 0.3),
    pose({ rightShoulder: [-0.8, 0, -1.2], rightElbow: [-0.3, 0, -0.5], rightWrist: [0, 0, -0.3] }, 0.3),
    pose({}, 0.4),
  ],
  thank_you: [
    pose({ rightShoulder: [-0.6, 0.2, -0.3], rightElbow: [-0.8, 0, 0], rightFingers: [0.2, 0, 0] }, 0.4),
    pose({ rightShoulder: [-0.3, 0.3, -0.5], rightElbow: [-0.4, 0, -0.2], rightFingers: [0.5, 0, 0], head: [0.15, 0, 0] }, 0.5),
    pose({ head: [0.1, 0, 0] }, 0.3),
    pose({}, 0.4),
  ],
  please: [
    pose({ rightShoulder: [0.2, 0, -0.3], rightElbow: [-0.5, 0, -0.2], rightFingers: [0.3, 0, 0] }, 0.3),
    pose({ rightShoulder: [0.2, 0, -0.3], rightElbow: [-0.5, 0, -0.2], rightFingers: [0.3, 0, 0], spine: [0, 0.1, 0] }, 0.4),
    pose({ rightShoulder: [0.2, 0, -0.3], rightElbow: [-0.5, 0, -0.2], rightFingers: [0.3, 0, 0], spine: [0, -0.1, 0] }, 0.4),
    pose({}, 0.3),
  ],
  sorry: [
    pose({ rightShoulder: [0.1, 0, -0.2], rightElbow: [-0.7, 0, 0], rightFingers: [0.4, 0, 0] }, 0.4),
    pose({ rightShoulder: [0.1, 0, -0.2], rightElbow: [-0.7, 0, 0], rightFingers: [0.4, 0, 0], spine: [0, 0.15, 0] }, 0.4),
    pose({ rightShoulder: [0.1, 0, -0.2], rightElbow: [-0.7, 0, 0], rightFingers: [0.4, 0, 0], spine: [0, -0.15, 0] }, 0.4),
    pose({ head: [0.1, 0, 0] }, 0.3),
    pose({}, 0.3),
  ],
  yes: [
    pose({ head: [0.2, 0, 0] }, 0.25),
    pose({ head: [-0.1, 0, 0] }, 0.2),
    pose({ head: [0.2, 0, 0] }, 0.2),
    pose({ head: [-0.1, 0, 0] }, 0.2),
    pose({}, 0.3),
  ],
  no: [
    pose({ head: [0, 0.3, 0] }, 0.2),
    pose({ head: [0, -0.3, 0] }, 0.25),
    pose({ head: [0, 0.3, 0] }, 0.25),
    pose({ head: [0, -0.3, 0] }, 0.2),
    pose({}, 0.3),
  ],
  help: [
    pose({
      leftShoulder: [-0.5, 0, 0.5], leftElbow: [-0.3, 0, 0.2],
      rightShoulder: [-0.5, 0, -0.5], rightElbow: [-0.3, 0, -0.2],
    }, 0.4),
    pose({
      leftShoulder: [-1.0, 0, 0.8], leftElbow: [-0.5, 0, 0.3],
      rightShoulder: [-1.0, 0, -0.8], rightElbow: [-0.5, 0, -0.3],
    }, 0.5),
    pose({
      leftShoulder: [-0.8, 0, 0.6], leftElbow: [-0.4, 0, 0.2],
      rightShoulder: [-0.8, 0, -0.6], rightElbow: [-0.4, 0, -0.2],
    }, 0.4),
    pose({}, 0.4),
  ],
  emergency: [
    pose({
      leftShoulder: [-1.2, 0, 0.6], leftElbow: [-0.2, 0, 0],
      rightShoulder: [-1.2, 0, -0.6], rightElbow: [-0.2, 0, 0],
    }, 0.3),
    pose({
      leftShoulder: [-1.4, 0, 0.8], leftElbow: [-0.4, 0, 0.2],
      rightShoulder: [-1.4, 0, -0.8], rightElbow: [-0.4, 0, -0.2],
    }, 0.3),
    pose({
      leftShoulder: [-1.2, 0, 0.6], leftElbow: [-0.2, 0, 0],
      rightShoulder: [-1.2, 0, -0.6], rightElbow: [-0.2, 0, 0],
    }, 0.3),
    pose({}, 0.3),
  ],
  water: [
    pose({ rightShoulder: [-0.3, 0, -0.2], rightElbow: [-0.8, 0, 0], rightWrist: [0, 0.3, 0] }, 0.4),
    pose({ rightShoulder: [-0.5, 0, -0.1], rightElbow: [-1.0, 0, 0], rightWrist: [0.3, 0, 0], head: [-0.15, 0, 0] }, 0.5),
    pose({ head: [0, 0, 0] }, 0.3),
    pose({}, 0.3),
  ],
  food: [
    pose({ rightShoulder: [-0.3, 0, -0.2], rightElbow: [-0.9, 0, 0], rightFingers: [0.5, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.4, 0, -0.1], rightElbow: [-1.0, 0, 0], rightFingers: [0.5, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.3, 0, -0.2], rightElbow: [-0.9, 0, 0], rightFingers: [0.5, 0, 0] }, 0.3),
    pose({}, 0.3),
  ],
  home: [
    pose({ rightShoulder: [-0.3, 0.2, -0.3], rightElbow: [-0.5, 0, 0], rightFingers: [0.3, 0, 0] }, 0.3),
    pose({
      leftShoulder: [-0.8, 0, 0.7], leftElbow: [-0.3, 0, 0.5],
      rightShoulder: [-0.8, 0, -0.7], rightElbow: [-0.3, 0, -0.5],
    }, 0.5),
    pose({}, 0.4),
  ],
  family: [
    pose({
      leftShoulder: [-0.5, 0, 0.4], leftElbow: [-0.3, 0, 0.2],
      rightShoulder: [-0.5, 0, -0.4], rightElbow: [-0.3, 0, -0.2],
    }, 0.4),
    pose({
      leftShoulder: [-0.5, 0.2, 0.4], leftElbow: [-0.3, 0, 0.2],
      rightShoulder: [-0.5, 0.2, -0.4], rightElbow: [-0.3, 0, -0.2],
      spine: [0, 0.1, 0],
    }, 0.5),
    pose({}, 0.4),
  ],
  love: [
    pose({
      leftShoulder: [0.3, 0, 0.2], leftElbow: [-0.8, 0, 0.3],
      rightShoulder: [0.3, 0, -0.2], rightElbow: [-0.8, 0, -0.3],
    }, 0.5),
    pose({
      leftShoulder: [0.1, 0, 0.1], leftElbow: [-1.0, 0, 0.4],
      rightShoulder: [0.1, 0, -0.1], rightElbow: [-1.0, 0, -0.4],
      head: [0.1, 0, 0],
    }, 0.6),
    pose({}, 0.4),
  ],
  happy: [
    pose({
      leftShoulder: [-0.8, 0, 0.8], leftElbow: [-0.3, 0, 0.3],
      rightShoulder: [-0.8, 0, -0.8], rightElbow: [-0.3, 0, -0.3],
      head: [-0.1, 0, 0],
    }, 0.4),
    pose({
      leftShoulder: [-1.0, 0, 1.0], leftElbow: [-0.2, 0, 0.4],
      rightShoulder: [-1.0, 0, -1.0], rightElbow: [-0.2, 0, -0.4],
    }, 0.4),
    pose({}, 0.4),
  ],
  sad: [
    pose({ head: [0.2, 0, 0], spine: [0.1, 0, 0] }, 0.5),
    pose({
      rightShoulder: [-0.2, 0, -0.1], rightElbow: [-0.6, 0, 0],
      head: [0.25, 0, 0], spine: [0.15, 0, 0],
    }, 0.6),
    pose({}, 0.5),
  ],
  good: [
    pose({ rightShoulder: [-0.5, 0, -0.3], rightElbow: [-0.3, 0, -0.1], rightFingers: [-0.5, 0, 0] }, 0.4),
    pose({ rightShoulder: [-0.7, 0, -0.5], rightElbow: [-0.2, 0, -0.2], rightFingers: [-0.5, 0, 0] }, 0.4),
    pose({}, 0.3),
  ],
  bad: [
    pose({ rightShoulder: [-0.3, 0, -0.2], rightElbow: [-0.8, 0, 0], rightFingers: [0.5, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.1, 0.3, -0.5], rightElbow: [-0.3, 0, -0.3], rightFingers: [0.5, 0, 0] }, 0.5),
    pose({}, 0.3),
  ],
  stop: [
    pose({
      rightShoulder: [-1.2, 0, -0.5], rightElbow: [0, 0, 0], rightWrist: [-0.3, 0, 0],
      rightFingers: [-0.3, 0, 0],
    }, 0.4),
    pose({
      rightShoulder: [-1.2, 0, -0.5], rightElbow: [0, 0, 0], rightWrist: [-0.3, 0, 0],
      rightFingers: [-0.3, 0, 0],
    }, 0.6),
    pose({}, 0.4),
  ],
  come: [
    pose({ rightShoulder: [-0.5, 0, -0.6], rightElbow: [-0.5, 0, -0.2], rightFingers: [0.3, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.3, 0, -0.3], rightElbow: [-0.8, 0, 0], rightFingers: [0.6, 0, 0] }, 0.4),
    pose({ rightShoulder: [-0.5, 0, -0.6], rightElbow: [-0.5, 0, -0.2], rightFingers: [0.3, 0, 0] }, 0.3),
    pose({}, 0.3),
  ],
  go: [
    pose({ rightShoulder: [-0.3, 0, -0.3], rightElbow: [-0.6, 0, 0], rightFingers: [-0.2, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.5, 0, -0.8], rightElbow: [-0.2, 0, -0.3], rightFingers: [-0.2, 0, 0] }, 0.5),
    pose({}, 0.3),
  ],
  wait: [
    pose({
      leftShoulder: [-0.4, 0, 0.3], leftElbow: [-0.3, 0, 0.1],
      rightShoulder: [-0.4, 0, -0.3], rightElbow: [-0.3, 0, -0.1],
      rightFingers: [-0.3, 0, 0], leftFingers: [-0.3, 0, 0],
    }, 0.5),
    pose({
      leftShoulder: [-0.4, 0, 0.3], leftElbow: [-0.3, 0, 0.1],
      rightShoulder: [-0.4, 0, -0.3], rightElbow: [-0.3, 0, -0.1],
      rightFingers: [-0.3, 0, 0], leftFingers: [-0.3, 0, 0],
    }, 0.8),
    pose({}, 0.4),
  ],
  understand: [
    pose({ rightShoulder: [-0.3, 0.2, -0.2], rightElbow: [-0.8, 0, 0], rightFingers: [-0.3, 0, 0] }, 0.4),
    pose({ rightShoulder: [-0.5, 0.2, -0.2], rightElbow: [-0.5, 0, -0.2], rightFingers: [-0.3, 0, 0], head: [0.1, 0, 0] }, 0.4),
    pose({}, 0.3),
  ],
  name: [
    pose({
      leftShoulder: [-0.3, 0, 0.2], leftElbow: [-0.6, 0, 0.1],
      rightShoulder: [-0.3, 0, -0.2], rightElbow: [-0.6, 0, -0.1],
    }, 0.4),
    pose({
      leftShoulder: [-0.3, 0, 0.2], leftElbow: [-0.6, 0, 0.1],
      rightShoulder: [-0.5, 0, -0.4], rightElbow: [-0.4, 0, -0.2],
    }, 0.4),
    pose({}, 0.3),
  ],
  mother: [
    pose({ rightShoulder: [-0.3, 0.2, -0.2], rightElbow: [-0.7, 0, 0], rightFingers: [0.2, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.2, 0.1, -0.1], rightElbow: [-0.5, 0, 0], head: [0.1, 0, 0] }, 0.4),
    pose({}, 0.3),
  ],
  father: [
    pose({ rightShoulder: [-0.5, 0.2, -0.3], rightElbow: [-0.5, 0, 0], rightFingers: [0.2, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.3, 0.1, -0.1], rightElbow: [-0.3, 0, 0], head: [0.1, 0, 0] }, 0.4),
    pose({}, 0.3),
  ],
  friend: [
    pose({
      leftShoulder: [-0.3, 0, 0.2], leftElbow: [-0.5, 0, 0.1],
      rightShoulder: [-0.3, 0, -0.2], rightElbow: [-0.5, 0, -0.1],
      leftFingers: [0.4, 0, 0], rightFingers: [0.4, 0, 0],
    }, 0.4),
    pose({
      leftShoulder: [-0.3, 0, 0.2], leftElbow: [-0.5, 0, 0.1],
      rightShoulder: [-0.3, 0, -0.2], rightElbow: [-0.5, 0, -0.1],
      leftFingers: [0.4, 0, 0], rightFingers: [0.4, 0, 0],
    }, 0.5),
    pose({}, 0.3),
  ],
  doctor: [
    pose({ rightShoulder: [-0.3, 0, -0.2], rightElbow: [-0.7, 0, 0], rightFingers: [0.3, 0, 0] }, 0.3),
    pose({
      rightShoulder: [-0.2, 0, -0.1],
      leftShoulder: [-0.3, 0, 0.3], leftElbow: [-0.5, 0, 0.1],
    }, 0.4),
    pose({}, 0.3),
  ],
  school: [
    pose({
      leftShoulder: [-0.3, 0, 0.3], leftElbow: [-0.5, 0, 0.2],
      rightShoulder: [-0.5, 0, -0.3], rightElbow: [-0.3, 0, -0.2],
    }, 0.4),
    pose({
      rightShoulder: [-0.3, 0, -0.5], rightElbow: [-0.5, 0, -0.3],
    }, 0.4),
    pose({}, 0.3),
  ],
  work: [
    pose({
      leftShoulder: [-0.2, 0, 0.2], leftElbow: [-0.6, 0, 0.1],
      rightShoulder: [-0.2, 0, -0.2], rightElbow: [-0.6, 0, -0.1],
      rightFingers: [0.5, 0, 0], leftFingers: [0.5, 0, 0],
    }, 0.3),
    pose({
      leftShoulder: [-0.2, 0, 0.2], leftElbow: [-0.6, 0, 0.1],
      rightShoulder: [-0.4, 0, -0.3], rightElbow: [-0.4, 0, -0.2],
      rightFingers: [0.5, 0, 0], leftFingers: [0.5, 0, 0],
    }, 0.4),
    pose({
      leftShoulder: [-0.2, 0, 0.2], leftElbow: [-0.6, 0, 0.1],
      rightShoulder: [-0.2, 0, -0.2], rightElbow: [-0.6, 0, -0.1],
      rightFingers: [0.5, 0, 0], leftFingers: [0.5, 0, 0],
    }, 0.3),
    pose({}, 0.3),
  ],
  morning: [
    pose({
      rightShoulder: [-0.8, 0, -0.8], rightElbow: [-0.2, 0, -0.3],
    }, 0.4),
    pose({
      rightShoulder: [-1.2, 0, -0.6], rightElbow: [-0.1, 0, -0.2],
      head: [-0.1, 0, 0],
    }, 0.5),
    pose({}, 0.4),
  ],
  what: [
    pose({
      leftShoulder: [-0.4, 0, 0.4], leftElbow: [-0.3, 0, 0.2],
      rightShoulder: [-0.4, 0, -0.4], rightElbow: [-0.3, 0, -0.2],
      head: [0, 0.1, 0],
    }, 0.3),
    pose({
      leftShoulder: [-0.5, 0, 0.5], leftElbow: [-0.3, 0, 0.3],
      rightShoulder: [-0.5, 0, -0.5], rightElbow: [-0.3, 0, -0.3],
      head: [0, -0.1, 0],
    }, 0.4),
    pose({}, 0.3),
  ],
  where: [
    pose({ rightShoulder: [-0.5, 0, -0.5], rightElbow: [-0.3, 0, -0.2], rightFingers: [-0.3, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.5, 0.3, -0.5], rightElbow: [-0.3, 0, -0.2], rightFingers: [-0.3, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.5, -0.3, -0.5], rightElbow: [-0.3, 0, -0.2], rightFingers: [-0.3, 0, 0] }, 0.3),
    pose({}, 0.3),
  ],
  when: [
    pose({ rightShoulder: [-0.3, 0, -0.3], rightElbow: [-0.5, 0, -0.1], rightFingers: [-0.2, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.3, 0.2, -0.3], rightElbow: [-0.5, 0, -0.1] }, 0.4),
    pose({}, 0.3),
  ],
  who: [
    pose({ rightShoulder: [-0.3, 0.1, -0.2], rightElbow: [-0.7, 0, 0], rightFingers: [-0.2, 0, 0] }, 0.3),
    pose({ rightShoulder: [-0.3, 0.1, -0.2], rightElbow: [-0.7, 0, 0], rightFingers: [-0.2, 0, 0], head: [0, 0.1, 0] }, 0.4),
    pose({}, 0.3),
  ],
  how: [
    pose({
      leftShoulder: [-0.3, 0, 0.3], leftElbow: [-0.5, 0, 0.2],
      rightShoulder: [-0.3, 0, -0.3], rightElbow: [-0.5, 0, -0.2],
    }, 0.3),
    pose({
      leftShoulder: [-0.5, 0, 0.5], leftElbow: [-0.3, 0, 0.3],
      rightShoulder: [-0.5, 0, -0.5], rightElbow: [-0.3, 0, -0.3],
    }, 0.4),
    pose({}, 0.3),
  ],
};

// Generate a fallback animation for unknown signs (generic wave)
function getDefaultAnimation() {
  return [
    pose({ rightShoulder: [-0.6, 0, -0.6], rightElbow: [-0.3, 0, -0.2] }, 0.4),
    pose({ rightShoulder: [-0.8, 0, -0.8], rightElbow: [-0.2, 0, -0.3] }, 0.4),
    pose({}, 0.4),
  ];
}

export function getSignAnimation(signName) {
  const key = signName?.toLowerCase().replace(/ /g, '_');
  return SIGN_ANIMATIONS[key] || getDefaultAnimation();
}

export function getRestPose() {
  return REST_POSE;
}

export { SIGN_ANIMATIONS };
