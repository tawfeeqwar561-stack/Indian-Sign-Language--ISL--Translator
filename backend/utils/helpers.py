"""General-purpose helper utilities."""

import time
import hashlib
import json
import numpy as np
from functools import wraps


def timer(func):
    """Decorator that returns (result, elapsed_ms)."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        t0 = time.perf_counter()
        result = func(*args, **kwargs)
        return result, (time.perf_counter() - t0) * 1000
    return wrapper


def softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()


def top_k_predictions(probs, labels, k=3):
    """Return top-k (label, confidence) dicts."""
    idx = np.argsort(probs)[::-1][:k]
    return [{'label': labels[i], 'confidence': float(probs[i]), 'index': int(i)} for i in idx]


def needs_disambiguation(probs, threshold=0.15):
    """True when the gap between #1 and #2 predictions is too small."""
    s = np.sort(probs)[::-1]
    return len(s) >= 2 and (s[0] - s[1]) < threshold


def is_emergency_context(sign, emotion, emergency_signs, emergency_emotions):
    """Decide whether the current frame context is an emergency."""
    return sign.lower() in [s.lower() for s in emergency_signs] or \
           (emotion.lower() in [e.lower() for e in emergency_emotions]
            and sign.lower() in [s.lower() for s in emergency_signs])


class FPSCounter:
    """Sliding-window FPS meter."""

    def __init__(self, window=30):
        self._ts = []
        self._w = window

    def tick(self):
        self._ts.append(time.perf_counter())
        if len(self._ts) > self._w:
            self._ts.pop(0)

    @property
    def fps(self):
        if len(self._ts) < 2:
            return 0.0
        dt = self._ts[-1] - self._ts[0]
        return (len(self._ts) - 1) / dt if dt else 0.0