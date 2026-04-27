# Multimodal Fusion
"""
Multimodal Fusion Layer.

Combines gesture embedding (256-d) and emotion embedding (64-d) into a
semantically enriched representation that captures *what* is being signed
and *how* it is being expressed.

Supports three fusion strategies:
  1. Concatenation + MLP   (default, simplest)
  2. Gated fusion          (emotion gates the gesture)
  3. Cross-attention       (transformer-style, highest quality)
"""

import time
import logging
import numpy as np

from models.model_utils import HAS_TF

if HAS_TF:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers

logger = logging.getLogger(__name__)


class MultimodalFusion:
    """Fuse gesture and emotion embeddings."""

    def __init__(self, config: dict):
        self.gesture_dim = config.get('GESTURE_EMBEDDING_DIM', 256)
        self.emotion_dim = config.get('EMOTION_EMBEDDING_DIM', 64)
        self.fused_dim = config.get('FUSED_DIM', 320)
        self.strategy = 'gated'   # 'concat' | 'gated' | 'attention'
        self.model = self._build()

    def fuse(self, gesture_emb: np.ndarray, emotion_emb: np.ndarray) -> dict:
        """
        Merge two embeddings into a single fused vector.

        Returns:
            dict with 'fused_embedding', 'emotion_gate_value', 'latency_ms'
        """
        g = gesture_emb[np.newaxis, ...].astype(np.float32)
        e = emotion_emb[np.newaxis, ...].astype(np.float32)
        t0 = time.perf_counter()

        if self.model is not None:
            fused = self.model.predict([g, e], verbose=0)[0]
        else:
            # Stub: simple concatenation + truncation
            fused = np.concatenate([gesture_emb, emotion_emb])[:self.fused_dim]
            if len(fused) < self.fused_dim:
                fused = np.pad(fused, (0, self.fused_dim - len(fused)))

        lat = (time.perf_counter() - t0) * 1000
        return {
            'fused_embedding': fused,
            'latency_ms': lat,
        }

    # ── Model builder ────────────────────────────────────────

    def _build(self):
        if not HAS_TF:
            logger.warning("TensorFlow not available — fusion model in stub mode")
            return None

        g_in = keras.Input(shape=(self.gesture_dim,), name='gesture_emb')
        e_in = keras.Input(shape=(self.emotion_dim,), name='emotion_emb')

        if self.strategy == 'concat':
            x = layers.Concatenate()([g_in, e_in])
            x = layers.Dense(self.fused_dim, activation='relu')(x)
            x = layers.Dropout(0.2)(x)
            x = layers.Dense(self.fused_dim, activation='relu', name='fused_out')(x)

        elif self.strategy == 'gated':
            # Emotion acts as a gate on gesture features
            gate = layers.Dense(self.gesture_dim, activation='sigmoid', name='emotion_gate')(e_in)
            gated_gesture = layers.Multiply()([g_in, gate])
            x = layers.Concatenate()([gated_gesture, e_in])
            x = layers.Dense(self.fused_dim, activation='relu')(x)
            x = layers.Dropout(0.2)(x)
            x = layers.Dense(self.fused_dim, activation='relu', name='fused_out')(x)

        else:  # attention
            g_proj = layers.Dense(128)(g_in)
            e_proj = layers.Dense(128)(e_in)
            g_exp = layers.Reshape((1, 128))(g_proj)
            e_exp = layers.Reshape((1, 128))(e_proj)
            cat = layers.Concatenate(axis=1)([g_exp, e_exp])
            att = layers.MultiHeadAttention(num_heads=4, key_dim=32)(cat, cat)
            att = layers.Flatten()(att)
            x = layers.Dense(self.fused_dim, activation='relu')(att)
            x = layers.Dropout(0.2)(x)
            x = layers.Dense(self.fused_dim, activation='relu', name='fused_out')(x)

        model = keras.Model([g_in, e_in], x, name='multimodal_fusion')
        model.compile(optimizer='adam', loss='mse')
        logger.info(f"Fusion model built ({self.strategy})")
        return model