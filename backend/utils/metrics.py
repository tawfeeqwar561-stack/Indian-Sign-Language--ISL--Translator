"""Real-time metrics tracker for monitoring pipeline performance."""

import time
import numpy as np
from collections import defaultdict, deque


class MetricsTracker:
    """Maintains sliding-window stats for latencies and confidences."""

    def __init__(self, window=100):
        self._lat = {k: deque(maxlen=window) for k in
                     ('preprocessing', 'gesture_inference', 'emotion_inference',
                      'fusion', 'translation', 'tts', 'total_pipeline')}
        self._conf = {k: deque(maxlen=window) for k in ('gesture', 'emotion')}
        self._counts = defaultdict(int)
        self._errors = deque(maxlen=window)

    def record_latency(self, stage, ms):
        if stage in self._lat:
            self._lat[stage].append(ms)

    def record_confidence(self, model, val):
        if model in self._conf:
            self._conf[model].append(val)

    def record_prediction(self, label):
        self._counts[label] += 1

    def record_error(self, err_type, detail=""):
        self._errors.append({'ts': time.time(), 'type': err_type, 'detail': detail})

    def _stats(self, vals):
        if not vals:
            return {k: 0 for k in ('mean', 'p50', 'p95', 'min', 'max')}
        a = list(vals)
        return {'mean': float(np.mean(a)), 'p50': float(np.median(a)),
                'p95': float(np.percentile(a, 95)),
                'min': float(np.min(a)), 'max': float(np.max(a))}

    def get_summary(self):
        return {
            'latency': {s: self._stats(v) for s, v in self._lat.items()},
            'confidence': {m: self._stats(v) for m, v in self._conf.items()},
            'prediction_counts': dict(self._counts),
            'recent_errors': list(self._errors)[-10:],
        }


metrics = MetricsTracker()