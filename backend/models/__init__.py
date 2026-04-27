# Model package. Exposes a global ModelManager singleton that lazy-loads
# all ML components (gesture, emotion, fusion, translation, TTS).
"""
Model package. Exposes a global ModelManager singleton that lazy-loads
all ML components (gesture, emotion, fusion, translation, TTS).
Includes a robust demo mode that produces realistic results.
"""

import time
import random
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Demo vocabulary for cycling through realistic results
_DEMO_SIGNS = [
    "hello", "thank_you", "please", "sorry", "yes", "no", "help",
    "water", "food", "home", "family", "mother", "father", "friend",
    "love", "happy", "sad", "good", "bad", "come", "go", "stop",
    "wait", "understand", "name", "what", "where", "when", "who",
    "how", "doctor", "school", "work", "morning",
]

_DEMO_EMOTIONS = [
    ("happiness", 0.82), ("neutral", 0.91), ("sadness", 0.73),
    ("happiness", 0.88), ("neutral", 0.95), ("anger", 0.67),
    ("neutral", 0.90), ("happiness", 0.79), ("fear", 0.61),
    ("surprise", 0.75),
]


class DemoGestureModel:
    """Produces cycling demo gesture results."""

    def __init__(self):
        self.vocabulary = _DEMO_SIGNS + [f"sign_{i}" for i in range(len(_DEMO_SIGNS), 200)]
        self._idx = 0
        self._frame_count = 0

    def feed_frame(self, keypoints):
        self._frame_count += 1

    def try_recognize(self):
        # Return a result every ~30 frames (roughly every 2 seconds at 15 fps)
        if self._frame_count % 30 != 0:
            return None
        sign = _DEMO_SIGNS[self._idx % len(_DEMO_SIGNS)]
        conf = 0.65 + random.random() * 0.30  # 0.65–0.95
        self._idx += 1
        return {
            'sign': sign,
            'confidence': round(conf, 3),
            'is_confident': conf >= 0.65,
            'needs_disambiguation': conf < 0.72,
            'top_k': [
                {'sign': sign, 'confidence': round(conf, 3)},
                {'sign': _DEMO_SIGNS[(self._idx + 1) % len(_DEMO_SIGNS)],
                 'confidence': round(conf * 0.6, 3)},
                {'sign': _DEMO_SIGNS[(self._idx + 2) % len(_DEMO_SIGNS)],
                 'confidence': round(conf * 0.3, 3)},
            ],
            'embedding': np.zeros(256, dtype=np.float32),
            'latency_ms': round(random.uniform(5, 25), 1),
        }

    def reset(self):
        self._frame_count = 0


class DemoEmotionModel:
    """Produces cycling demo emotion results."""

    def __init__(self):
        self._idx = 0

    def recognize(self, face_crop):
        emotion, conf = _DEMO_EMOTIONS[self._idx % len(_DEMO_EMOTIONS)]
        self._idx += 1
        probs = {e: round(random.random() * 0.2, 3) for e in
                 ['happiness', 'sadness', 'anger', 'neutral', 'urgency', 'fear', 'surprise']}
        probs[emotion] = round(conf, 3)
        return {
            'emotion': emotion,
            'confidence': round(conf, 3),
            'is_confident': conf >= 0.5,
            'probabilities': probs,
            'embedding': np.zeros(64, dtype=np.float32),
            'latency_ms': round(random.uniform(3, 15), 1),
        }


class DemoFusionModel:
    """Simple concatenation fusion stub."""

    def fuse(self, gesture_emb, emotion_emb):
        fused = np.concatenate([gesture_emb, emotion_emb])[:320]
        if len(fused) < 320:
            fused = np.pad(fused, (0, 320 - len(fused)))
        return {
            'fused_embedding': fused,
            'latency_ms': round(random.uniform(1, 5), 1),
        }


class ModelManager:
    """Lifecycle manager for every ML component."""

    def __init__(self):
        self.gesture_model = None
        self.emotion_model = None
        self.fusion_model = None
        self.translation_engine = None
        self.tts_engine = None
        self.is_initialized = False
        self.config = None
        self.demo_mode = False

    def initialize(self, config):
        self.config = config
        errors = []

        try:
            from models.gesture_model import GestureRecognizer
            self.gesture_model = GestureRecognizer(config)
            logger.info("✓ Gesture model ready")
        except Exception as e:
            logger.warning(f"⚠ Gesture model unavailable: {e}")
            self.gesture_model = DemoGestureModel()
            errors.append(('gesture', e))

        try:
            from models.emotion_model import EmotionRecognizer
            self.emotion_model = EmotionRecognizer(config)
            logger.info("✓ Emotion model ready")
        except Exception as e:
            logger.warning(f"⚠ Emotion model unavailable: {e}")
            self.emotion_model = DemoEmotionModel()
            errors.append(('emotion', e))

        try:
            from models.fusion_model import MultimodalFusion
            self.fusion_model = MultimodalFusion(config)
            logger.info("✓ Fusion model ready")
        except Exception as e:
            logger.warning(f"⚠ Fusion model unavailable: {e}")
            self.fusion_model = DemoFusionModel()
            errors.append(('fusion', e))

        try:
            from models.translation_engine import TranslationEngine
            self.translation_engine = TranslationEngine(config)
            logger.info("✓ Translation engine ready")
        except Exception as e:
            logger.warning(f"⚠ Translation engine unavailable: {e}")
            errors.append(('translation', e))

        try:
            from models.tts_engine import TTSEngine
            self.tts_engine = TTSEngine(config)
            logger.info("✓ TTS engine ready")
        except Exception as e:
            logger.warning(f"⚠ TTS engine unavailable: {e}")
            errors.append(('tts', e))

        self.is_initialized = True
        if errors:
            self.demo_mode = True
            logger.warning(f"⚠ Running in DEMO mode — {len(errors)} component(s) degraded")
        else:
            logger.info("All models initialized successfully")

    def get_status(self):
        return {
            'initialized': self.is_initialized,
            'demo_mode': self.demo_mode,
            'gesture': self.gesture_model is not None,
            'emotion': self.emotion_model is not None,
            'fusion': self.fusion_model is not None,
            'translation': self.translation_engine is not None,
            'tts': self.tts_engine is not None,
        }


model_manager = ModelManager()