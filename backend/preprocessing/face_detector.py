# Face Detection & Landmarks
"""
Face detection and emotion-feature extraction via MediaPipe Face Mesh.
Outputs a cropped, normalised face image and geometric expression features.
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)

try:
    import mediapipe as mp
    import cv2
    if not hasattr(mp, 'solutions'):
        raise ImportError("mediapipe installed but missing 'solutions' submodule")
    HAS_MEDIAPIPE = True
except (ImportError, AttributeError) as e:
    HAS_MEDIAPIPE = False
    logger.warning(f"MediaPipe/OpenCV not available — face detection in stub mode: {e}")


class FaceDetector:
    """Detect face, crop it, and compute expression-relevant geometric features."""

    FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,
                 379,378,400,377,152,148,176,149,150,136,172,58,132,93,
                 234,127,162,21,54,103,67,109]

    EXPR_IDX = [
        46,53,52,65,55,                           # L eyebrow
        276,283,282,295,285,                       # R eyebrow
        33,7,163,144,145,153,154,155,133,          # L eye
        362,382,381,380,374,373,390,249,263,       # R eye
        1,2,98,327,                                # Nose
        61,146,91,181,84,17,314,405,321,375,291,   # Outer lips
        78,95,88,178,87,14,317,402,318,324,308,    # Inner lips
    ]

    def __init__(self, config: dict):
        self.face_size = config.get('EMOTION_FACE_SIZE', (48, 48))
        if HAS_MEDIAPIPE:
            self.mp_fm = mp.solutions.face_mesh
            self.fm = self.mp_fm.FaceMesh(
                static_image_mode=False, max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=config.get('MEDIAPIPE_FACE_MIN_DETECTION_CONFIDENCE', 0.7),
                min_tracking_confidence=0.5,
            )
        else:
            self.fm = None

    def process_frame(self, frame: np.ndarray) -> dict:
        out = {'has_face': False, 'face_crop': None, 'face_crop_rgb': None,
               'face_bbox': None, 'face_landmarks': None, 'face_landmark_features': None}

        if not HAS_MEDIAPIPE:
            return out

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False
        res = self.fm.process(rgb)

        if not res.multi_face_landmarks:
            return out

        flm = res.multi_face_landmarks[0]
        h, w = frame.shape[:2]
        out['has_face'] = True

        pts = np.array([(flm.landmark[i].x * w, flm.landmark[i].y * h) for i in self.FACE_OVAL])
        x1, y1 = pts.min(0).astype(int)
        x2, y2 = pts.max(0).astype(int)
        pad = int(0.15 * (x2 - x1))
        x1, y1 = max(0, x1 - pad), max(0, y1 - pad)
        x2, y2 = min(w, x2 + pad), min(h, y2 + pad)
        out['face_bbox'] = (x1, y1, x2 - x1, y2 - y1)

        crop = frame[y1:y2, x1:x2]
        if crop.size:
            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            out['face_crop'] = cv2.resize(gray, self.face_size).astype(np.float32) / 255.0
            out['face_crop_rgb'] = cv2.resize(crop, self.face_size).astype(np.float32) / 255.0

        expr = np.array([[flm.landmark[i].x, flm.landmark[i].y, flm.landmark[i].z]
                         for i in self.EXPR_IDX], dtype=np.float32)
        out['face_landmarks'] = expr
        out['face_landmark_features'] = self._geometric(expr)
        return out

    def _geometric(self, lm: np.ndarray) -> np.ndarray:
        """Compute 5 hand-crafted expression features + flattened normalised coords."""
        centroid = lm.mean(0)
        norm = (lm - centroid).flatten()

        def ear(top, bot, l, r):
            return np.linalg.norm(top - bot) / (np.linalg.norm(l - r) + 1e-6)

        feats = [
            ear(lm[11], lm[14], lm[10], lm[18]),   # L eye AR
            ear(lm[20], lm[23], lm[19], lm[27]),   # R eye AR
            ear(lm[40], lm[45], lm[35], lm[46]),   # Mouth AR
            np.linalg.norm(lm[2] - lm[13]),         # L brow raise
            np.linalg.norm(lm[7] - lm[22]),         # R brow raise
        ]
        return np.concatenate([norm, np.array(feats, dtype=np.float32)])

    def release(self):
        if HAS_MEDIAPIPE and self.fm:
            self.fm.close()