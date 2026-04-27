# ISL Gesture Recognition
"""
ISL Gesture Recognition Model.

Architecture: MobileNetV2-style spatial encoder → Bi-LSTM temporal encoder.
Accepts keypoint sequences [batch, T, 226] and outputs class probabilities.

At production time the model runs as a TFLite interpreter; during development
it falls back to a Keras/TF model built here.
"""

import os
import time
import logging
import numpy as np

from models.model_utils import SequenceBuffer, load_tflite_model, run_tflite, HAS_TF

if HAS_TF:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers

logger = logging.getLogger(__name__)

# ── ISL vocabulary (200 signs) ────────────────────────────────────────────
# In production this list comes from a JSON/DB; here we include a starter set.

ISL_VOCABULARY = [
    "hello", "thank_you", "please", "sorry", "yes", "no", "help",
    "emergency", "pain", "danger", "fire", "police", "hospital",
    "accident", "sick", "hurt", "water", "food", "home", "school",
    "work", "family", "mother", "father", "friend", "love", "happy",
    "sad", "angry", "scared", "tired", "good", "bad", "big", "small",
    "come", "go", "stop", "wait", "understand", "not_understand",
    "name", "my", "your", "what", "where", "when", "who", "why",
    "how", "money", "time", "today", "tomorrow", "yesterday",
    "morning", "night", "eat", "drink", "sleep", "walk", "run",
    "sit", "stand", "read", "write", "learn", "teach", "doctor",
    "medicine", "telephone", "bathroom", "bus", "train", "car",
    "shop", "market", "cold", "hot", "rain", "boy", "girl", "man",
    "woman", "child", "baby", "old", "new", "open", "close",
    "take", "give", "buy", "sell", "need", "want", "can", "cannot",
    "like", "dislike",
] + [f"sign_{i}" for i in range(100, 200)]  # placeholders to reach 200


class GestureRecognizer:
    """Full gesture-recognition component: buffering → inference → decode."""

    def __init__(self, config: dict):
        self.seq_len = config.get('GESTURE_SEQUENCE_LENGTH', 30)
        self.stride = config.get('GESTURE_STRIDE', 5)
        self.input_dim = config.get('GESTURE_INPUT_DIM', 226)
        self.num_classes = config.get('GESTURE_NUM_CLASSES', 200)
        self.conf_threshold = config.get('GESTURE_CONFIDENCE_THRESHOLD', 0.65)
        self.ambiguity_threshold = config.get('GESTURE_AMBIGUITY_THRESHOLD', 0.15)
        self.embedding_dim = config.get('GESTURE_EMBEDDING_DIM', 256)
        self.vocabulary = ISL_VOCABULARY[:self.num_classes]

        self.buffer = SequenceBuffer(self.seq_len, self.stride, self.input_dim)

        # Try TFLite first, fall back to a newly-built Keras model
        tflite_path = config.get('GESTURE_MODEL_PATH', '')
        if os.path.isfile(tflite_path) and HAS_TF:
            logger.info("Loading gesture TFLite model")
            self.interpreter = load_tflite_model(tflite_path)
            self.model = None
        elif HAS_TF:
            logger.info("Building gesture Keras model (no TFLite found)")
            self.interpreter = None
            self.model = self._build_model()
        else:
            logger.warning("TensorFlow not available — gesture model in stub mode")
            self.interpreter = None
            self.model = None

    # ── Public API ───────────────────────────────────────────

    def feed_frame(self, keypoints: np.ndarray):
        """Push one frame's keypoints into the sliding window."""
        self.buffer.push(keypoints)

    def try_recognize(self) -> dict | None:
        """
        If enough frames, run inference and return result dict.
        Returns None when the buffer is not yet ready.
        """
        if not self.buffer.is_ready():
            return None

        seq = self.buffer.get_sequence()           # [1, T, 226]
        t0 = time.perf_counter()

        if self.interpreter:
            probs = run_tflite(self.interpreter, seq)[0]
        elif self.model is not None:
            out = self.model.predict(seq, verbose=0)
            probs = out['classification'][0] if isinstance(out, dict) else out[0]
        else:
            # Stub mode: return random probabilities
            probs = np.random.dirichlet(np.ones(self.num_classes))

        latency = (time.perf_counter() - t0) * 1000

        top_idx = int(np.argmax(probs))
        top_conf = float(probs[top_idx])
        sorted_idx = np.argsort(probs)[::-1]

        # Disambiguation check
        needs_disambig = (
            len(probs) >= 2
            and (probs[sorted_idx[0]] - probs[sorted_idx[1]]) < self.ambiguity_threshold
        )

        return {
            'sign': self.vocabulary[top_idx],
            'confidence': top_conf,
            'is_confident': top_conf >= self.conf_threshold,
            'needs_disambiguation': needs_disambig,
            'top_k': [
                {'sign': self.vocabulary[int(i)], 'confidence': float(probs[i])}
                for i in sorted_idx[:5]
            ],
            'embedding': self._get_embedding(seq),
            'latency_ms': latency,
        }

    def _get_embedding(self, seq: np.ndarray) -> np.ndarray:
        """Extract the penultimate-layer embedding for fusion."""
        if HAS_TF and self.model is not None:
            embed_model = keras.Model(
                self.model.input,
                self.model.get_layer('gesture_embedding').output,
            )
            return embed_model.predict(seq, verbose=0)[0]
        # For TFLite or stub mode, return a dummy vector
        return np.zeros(self.embedding_dim, dtype=np.float32)

    def reset(self):
        self.buffer.reset()

    # ── Model builder ────────────────────────────────────────

    def _build_model(self):
        """
        Lightweight spatiotemporal model:
          Input [T, 226] → Dense spatial encoder → BiLSTM → Dense → softmax
        Also exposes a named 'gesture_embedding' layer for the fusion module.
        """
        if not HAS_TF:
            return None

        inp = keras.Input(shape=(self.seq_len, self.input_dim), name='keypoint_seq')

        # Spatial encoder (per-frame)
        x = layers.TimeDistributed(layers.Dense(128, activation='relu'))(inp)
        x = layers.TimeDistributed(layers.BatchNormalization())(x)
        x = layers.TimeDistributed(layers.Dropout(0.3))(x)
        x = layers.TimeDistributed(layers.Dense(64, activation='relu'))(x)

        # Temporal encoder
        x = layers.Bidirectional(layers.LSTM(128, return_sequences=True, dropout=0.3))(x)
        x = layers.Bidirectional(layers.LSTM(64, return_sequences=False, dropout=0.3))(x)

        # Embedding
        embed = layers.Dense(self.embedding_dim, activation='relu', name='gesture_embedding')(x)
        embed = layers.Dropout(0.3)(embed)

        # Classifier head
        out = layers.Dense(self.num_classes, activation='softmax', name='classification')(embed)

        model = keras.Model(inputs=inp, outputs=out, name='gesture_recognizer')
        model.compile(
            optimizer=keras.optimizers.Adam(1e-3),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy'],
        )
        model.summary(print_fn=logger.info)
        return model