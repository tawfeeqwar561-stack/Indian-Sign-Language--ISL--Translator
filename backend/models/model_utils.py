# Utilities
"""Shared model utilities — sequence buffering, TFLite helpers, etc."""

import logging
import numpy as np
from collections import deque

logger = logging.getLogger(__name__)

# Check for TensorFlow availability
try:
    import tensorflow as tf
    HAS_TF = True
except ImportError:
    HAS_TF = False
    logger.warning("TensorFlow not available — ML models will run in stub mode")


class SequenceBuffer:
    """
    Sliding-window buffer that accumulates per-frame keypoints
    and yields fixed-length sequences for the temporal model.
    """

    def __init__(self, seq_len: int = 30, stride: int = 5, feature_dim: int = 226):
        self.seq_len = seq_len
        self.stride = stride
        self.feature_dim = feature_dim
        self._buf = deque(maxlen=seq_len)
        self._count = 0

    def push(self, keypoints: np.ndarray):
        """Add a single frame's keypoints to the buffer."""
        self._buf.append(keypoints)
        self._count += 1

    def is_ready(self) -> bool:
        """True when enough frames have been collected."""
        return len(self._buf) == self.seq_len and self._count % self.stride == 0

    def get_sequence(self) -> np.ndarray:
        """Return shape [1, seq_len, feature_dim] for model input."""
        seq = np.array(list(self._buf), dtype=np.float32)
        return seq[np.newaxis, ...]      # add batch dim

    def reset(self):
        self._buf.clear()
        self._count = 0


def load_tflite_model(path: str):
    """Load a TFLite model and allocate tensors."""
    if not HAS_TF:
        logger.warning("TFLite not available (no TensorFlow)")
        return None
    interp = tf.lite.Interpreter(model_path=path, num_threads=4)
    interp.allocate_tensors()
    return interp


def run_tflite(interp, input_data: np.ndarray) -> np.ndarray:
    """Run inference on a TFLite interpreter."""
    if interp is None:
        return np.zeros((1, 200), dtype=np.float32)
    inp = interp.get_input_details()
    out = interp.get_output_details()
    interp.set_tensor(inp[0]['index'], input_data.astype(np.float32))
    interp.invoke()
    return interp.get_tensor(out[0]['index'])