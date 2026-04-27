# Frame preprocessing
"""
Orchestrates per-frame preprocessing:  camera frame → features for models.
"""

import time, base64, logging
import numpy as np

logger = logging.getLogger(__name__)

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False
    logger.warning("OpenCV not available — frame processing in stub mode")

from preprocessing.hand_tracker import HandPoseTracker
from preprocessing.face_detector import FaceDetector


class FrameProcessor:
    def __init__(self, config: dict):
        self.hand_tracker = HandPoseTracker(config)
        self.face_detector = FaceDetector(config)
        self._cnt = 0

    def process(self, frame: np.ndarray) -> dict:
        t0 = time.perf_counter()
        self._cnt += 1

        if HAS_CV2:
            h, w = frame.shape[:2]
            if max(h, w) > 640:
                s = 640 / max(h, w)
                frame = cv2.resize(frame, None, fx=s, fy=s)

        hand = self.hand_tracker.process_frame(frame)
        face = self.face_detector.process_frame(frame)
        return {
            'frame_id': self._cnt, 'timestamp': time.time(),
            'hand': hand, 'face': face,
            'preprocessing_time_ms': (time.perf_counter() - t0) * 1000,
        }

    def decode_base64_frame(self, b64: str):
        if not HAS_CV2:
            # Return a dummy frame for stub mode
            return np.zeros((480, 640, 3), dtype=np.uint8)
        if ',' in b64:
            b64 = b64.split(',')[1]
        buf = np.frombuffer(base64.b64decode(b64), np.uint8)
        return cv2.imdecode(buf, cv2.IMREAD_COLOR)

    def release(self):
        self.hand_tracker.release()
        self.face_detector.release()