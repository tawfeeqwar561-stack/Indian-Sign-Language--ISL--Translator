# MediaPipe Hand Tracking
"""
MediaPipe hand + upper-body pose tracker.
Produces a fixed-size keypoint vector per frame for the gesture model.
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)

try:
    import mediapipe as mp
    import cv2
    # Verify mediapipe has the solutions API (missing in some versions)
    if not hasattr(mp, 'solutions'):
        raise ImportError("mediapipe installed but missing 'solutions' submodule")
    HAS_MEDIAPIPE = True
except (ImportError, AttributeError) as e:
    HAS_MEDIAPIPE = False
    logger.warning(f"MediaPipe/OpenCV not available — hand tracking in stub mode: {e}")


class HandPoseTracker:
    """Extract hand and upper-body keypoints from a BGR frame."""

    # Combined vector layout
    # Left hand  : 21 landmarks × 3 coords = 63
    # Right hand : 21 landmarks × 3 coords = 63
    # Upper pose : 25 landmarks × 4 (x,y,z,vis) = 100
    # Total = 226

    def __init__(self, config: dict):
        if HAS_MEDIAPIPE:
            self.mp_hands = mp.solutions.hands
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=config.get('MEDIAPIPE_MAX_NUM_HANDS', 2),
                min_detection_confidence=config.get('MEDIAPIPE_MIN_DETECTION_CONFIDENCE', 0.7),
                min_tracking_confidence=config.get('MEDIAPIPE_MIN_TRACKING_CONFIDENCE', 0.5),
                model_complexity=0,
            )
            self.mp_pose = mp.solutions.pose
            self.pose = self.mp_pose.Pose(
                static_image_mode=False, model_complexity=0,
                smooth_landmarks=True,
                min_detection_confidence=0.5, min_tracking_confidence=0.5,
            )
        else:
            self.hands = None
            self.pose = None
        self.UPPER_BODY_IDX = list(range(25))

    def process_frame(self, frame: np.ndarray) -> dict:
        result = {
            'hand_landmarks': [], 'hand_handedness': [],
            'pose_landmarks': None,
            'has_hands': False, 'has_pose': False,
            'combined_keypoints': None,
        }

        if not HAS_MEDIAPIPE:
            result['combined_keypoints'] = np.zeros(226, dtype=np.float32)
            return result

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False

        h_res = self.hands.process(rgb)
        p_res = self.pose.process(rgb)

        if h_res.multi_hand_landmarks:
            result['has_hands'] = True
            for i, hlm in enumerate(h_res.multi_hand_landmarks):
                lm = np.array([[l.x, l.y, l.z] for l in hlm.landmark], dtype=np.float32)
                result['hand_landmarks'].append(lm)
                if h_res.multi_handedness:
                    result['hand_handedness'].append(
                        h_res.multi_handedness[i].classification[0].label)

        if p_res.pose_landmarks:
            result['has_pose'] = True
            plm = p_res.pose_landmarks.landmark
            ub = np.array([[plm[i].x, plm[i].y, plm[i].z, plm[i].visibility]
                           for i in self.UPPER_BODY_IDX if i < len(plm)], dtype=np.float32)
            result['pose_landmarks'] = ub

        result['combined_keypoints'] = self._combine(result)
        return result

    # ── private ──────────────────────────────────────────────

    def _combine(self, r: dict) -> np.ndarray:
        left = np.zeros(63, dtype=np.float32)
        right = np.zeros(63, dtype=np.float32)
        pose = np.zeros(100, dtype=np.float32)

        for lm, hand in zip(r['hand_landmarks'], r['hand_handedness']):
            f = lm.flatten()
            if hand == 'Left':
                left[:len(f)] = f
            else:
                right[:len(f)] = f

        if len(r['hand_landmarks']) == 1 and not r['hand_handedness']:
            right[:r['hand_landmarks'][0].size] = r['hand_landmarks'][0].flatten()

        if r['pose_landmarks'] is not None:
            fp = r['pose_landmarks'].flatten()
            pose[:len(fp)] = fp

        return np.concatenate([left, right, pose])

    def release(self):
        if HAS_MEDIAPIPE and self.hands:
            self.hands.close()
            self.pose.close()