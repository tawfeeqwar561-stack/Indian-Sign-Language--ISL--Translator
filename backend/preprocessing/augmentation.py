# Data augmentation
"""
Data augmentation for keypoint sequences and face images.
Used during training to improve robustness.
"""

import random
import numpy as np
import cv2


class KeypointAugmentor:
    """Augment temporal keypoint sequences for gesture training."""

    def augment_sequence(self, seq: np.ndarray, label: int):
        """Return list of (augmented_seq, label) pairs."""
        out = [(seq.copy(), label)]
        out.append((self._time_stretch(seq, 0.8), label))
        out.append((self._time_stretch(seq, 1.2), label))
        out.append((seq + 0.02, label))
        out.append((seq - 0.02, label))
        out.append(((seq - seq.mean(0)) * 0.9 + seq.mean(0), label))
        out.append(((seq - seq.mean(0)) * 1.1 + seq.mean(0), label))
        out.append((seq + np.random.normal(0, 0.01, seq.shape).astype(np.float32), label))
        out.append((self._temporal_dropout(seq, 0.1), label))
        out.append((self._mirror(seq), label))
        return out

    def _time_stretch(self, seq, factor):
        T, D = seq.shape
        nT = max(2, int(T * factor))
        idx = np.linspace(0, T - 1, nT)
        s = np.stack([np.interp(idx, np.arange(T), seq[:, d]) for d in range(D)], axis=1)
        if s.shape[0] < T:
            s = np.vstack([s, np.zeros((T - s.shape[0], D))])
        return s[:T].astype(np.float32)

    def _temporal_dropout(self, seq, rate):
        c = seq.copy()
        n = int(seq.shape[0] * rate)
        for i in random.sample(range(seq.shape[0]), min(n, seq.shape[0])):
            c[i] = 0
        return c

    def _mirror(self, seq):
        m = seq.copy()
        for i in range(0, seq.shape[1], 3):
            m[:, i] = 1.0 - m[:, i]
        return m


class FaceAugmentor:
    """Augment face images for emotion training."""

    def augment(self, img: np.ndarray):
        out = [img.copy(), cv2.flip(img, 1)]
        for g in (0.7, 1.3):
            tbl = np.array([((i / 255.0) ** (1 / g)) * 255 for i in range(256)]).astype('uint8')
            adj = cv2.LUT((img * 255).astype(np.uint8) if img.max() <= 1 else img, tbl)
            out.append(adj.astype(np.float32) / 255.0 if img.max() <= 1 else adj)
        h, w = img.shape[:2]
        for a in (-10, 10):
            M = cv2.getRotationMatrix2D((w // 2, h // 2), a, 1.0)
            out.append(cv2.warpAffine(img, M, (w, h)))
        out.append(np.clip(img + np.random.normal(0, 0.02, img.shape).astype(np.float32), 0, 1))
        return out