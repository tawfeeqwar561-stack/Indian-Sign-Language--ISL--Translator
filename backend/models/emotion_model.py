# Facial Emotion Recognition
"""
Facial Emotion Recognition using a lightweight MobileNetV2-based CNN.

Classes: happiness, sadness, anger, neutral, urgency, fear, surprise (7).
Input : 48×48 grayscale face crop (expanded to 3-channel for MobileNet).
"""

import os
import time
import logging
import numpy as np

from models.model_utils import load_tflite_model, run_tflite, HAS_TF

if HAS_TF:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers

logger = logging.getLogger(__name__)


class EmotionRecognizer:
    """Classify facial emotion from a cropped face image."""

    def __init__(self, config: dict):
        self.classes = config.get('EMOTION_CLASSES',
                                  ['happiness','sadness','anger','neutral',
                                   'urgency','fear','surprise'])
        self.num_classes = len(self.classes)
        self.face_size = config.get('EMOTION_FACE_SIZE', (48, 48))
        self.conf_threshold = config.get('EMOTION_CONFIDENCE_THRESHOLD', 0.5)
        self.embedding_dim = config.get('EMOTION_EMBEDDING_DIM', 64)

        tflite_path = config.get('EMOTION_MODEL_PATH', '')
        if os.path.isfile(tflite_path) and HAS_TF:
            self.interpreter = load_tflite_model(tflite_path)
            self.model = None
        elif HAS_TF:
            self.interpreter = None
            self.model = self._build_model()
        else:
            logger.warning("TensorFlow not available — emotion model in stub mode")
            self.interpreter = None
            self.model = None

    # ── Public API ───────────────────────────────────────────

    def recognize(self, face_crop: np.ndarray) -> dict:
        """
        Classify emotion from a 48×48 float32 grayscale face crop.
        Returns label, confidence, full probabilities, embedding.
        """
        inp = self._prepare_input(face_crop)
        t0 = time.perf_counter()

        if self.interpreter:
            probs = run_tflite(self.interpreter, inp)[0]
        elif self.model is not None:
            out = self.model.predict(inp, verbose=0)
            probs = out[0] if not isinstance(out, dict) else out['emotion_out'][0]
        else:
            # Stub mode
            probs = np.random.dirichlet(np.ones(self.num_classes))

        latency = (time.perf_counter() - t0) * 1000
        idx = int(np.argmax(probs))
        conf = float(probs[idx])

        return {
            'emotion': self.classes[idx],
            'confidence': conf,
            'is_confident': conf >= self.conf_threshold,
            'probabilities': {c: float(probs[i]) for i, c in enumerate(self.classes)},
            'embedding': self._get_embedding(inp),
            'latency_ms': latency,
        }

    # ── Private ──────────────────────────────────────────────

    def _prepare_input(self, face: np.ndarray) -> np.ndarray:
        """Shape (48,48) gray → (1,48,48,3) for MobileNet."""
        if face.ndim == 2:
            face = np.stack([face]*3, axis=-1)
        if face.ndim == 3 and face.shape[0] != 1:
            face = face[np.newaxis, ...]
        return face.astype(np.float32)

    def _get_embedding(self, inp: np.ndarray) -> np.ndarray:
        if HAS_TF and self.model:
            em = keras.Model(self.model.input,
                             self.model.get_layer('emotion_embedding').output)
            return em.predict(inp, verbose=0)[0]
        return np.zeros(self.embedding_dim, dtype=np.float32)

    def _build_model(self):
        """Tiny custom CNN (MobileNet-inspired depthwise-separable blocks)."""
        if not HAS_TF:
            return None

        inp = keras.Input(shape=(48, 48, 3), name='face_input')

        def dsconv(x, filters, stride=1):
            x = layers.DepthwiseConv2D(3, strides=stride, padding='same', use_bias=False)(x)
            x = layers.BatchNormalization()(x)
            x = layers.ReLU(6.0)(x)
            x = layers.Conv2D(filters, 1, use_bias=False)(x)
            x = layers.BatchNormalization()(x)
            x = layers.ReLU(6.0)(x)
            return x

        x = layers.Conv2D(16, 3, strides=2, padding='same', use_bias=False)(inp)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU(6.0)(x)
        x = dsconv(x, 32, 2)
        x = dsconv(x, 64, 2)
        x = dsconv(x, 128, 2)
        x = layers.GlobalAveragePooling2D()(x)

        embed = layers.Dense(self.embedding_dim, activation='relu',
                             name='emotion_embedding')(x)
        embed = layers.Dropout(0.3)(embed)
        out = layers.Dense(self.num_classes, activation='softmax',
                           name='emotion_out')(embed)

        model = keras.Model(inp, out, name='emotion_recognizer')
        model.compile(optimizer='adam', loss='sparse_categorical_crossentropy',
                      metrics=['accuracy'])
        model.summary(print_fn=logger.info)
        return model