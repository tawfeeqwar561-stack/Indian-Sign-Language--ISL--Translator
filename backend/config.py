"""
Configuration module for the ISL Translation System.
Manages all environment-specific settings, model paths, thresholds,
and system-wide constants.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration class with all default settings."""

    # ── Flask Core ──
    SECRET_KEY = os.getenv('SECRET_KEY', 'isl-dev-key-change-me')
    DEBUG = False
    TESTING = False

    # ── Server ──
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))

    # ── Database ──
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///isl_translation.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── Redis ──
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # ── Model Paths ──
    MODEL_DIR = os.getenv('MODEL_DIR', os.path.join(os.path.dirname(__file__), 'saved_models'))
    GESTURE_MODEL_PATH = os.path.join(MODEL_DIR, 'gesture_model.tflite')
    EMOTION_MODEL_PATH = os.path.join(MODEL_DIR, 'emotion_model.tflite')
    FUSION_MODEL_PATH = os.path.join(MODEL_DIR, 'fusion_model.tflite')

    # ── MediaPipe ──
    MEDIAPIPE_MAX_NUM_HANDS = 2
    MEDIAPIPE_MIN_DETECTION_CONFIDENCE = 0.7
    MEDIAPIPE_MIN_TRACKING_CONFIDENCE = 0.5
    MEDIAPIPE_FACE_MIN_DETECTION_CONFIDENCE = 0.7

    # ── Gesture Recognition ──
    GESTURE_SEQUENCE_LENGTH = 30
    GESTURE_STRIDE = 5
    GESTURE_INPUT_DIM = 226          # 63 left + 63 right + 100 pose
    GESTURE_NUM_CLASSES = 200
    GESTURE_CONFIDENCE_THRESHOLD = 0.65
    GESTURE_AMBIGUITY_THRESHOLD = 0.15
    GESTURE_EMBEDDING_DIM = 256

    # ── Emotion Recognition ──
    EMOTION_CLASSES = ['happiness', 'sadness', 'anger', 'neutral', 'urgency', 'fear', 'surprise']
    EMOTION_NUM_CLASSES = 7
    EMOTION_FACE_SIZE = (48, 48)
    EMOTION_CONFIDENCE_THRESHOLD = 0.5
    EMOTION_EMBEDDING_DIM = 64

    # ── Fusion ──
    FUSED_DIM = 320

    # ── Translation ──
    SUPPORTED_LANGUAGES = {'en': 'English', 'ta': 'Tamil', 'hi': 'Hindi'}
    DEFAULT_LANGUAGE = 'en'

    # ── TTS ──
    TTS_ENGINE = os.getenv('TTS_ENGINE', 'gtts')
    TTS_CACHE_DIR = os.path.join(MODEL_DIR, 'tts_cache')

    # ── Federated Learning ──
    FL_ENABLED = os.getenv('FL_ENABLED', 'false').lower() == 'true'
    FL_MIN_CLIENTS = int(os.getenv('FL_MIN_CLIENTS', 3))
    FL_ROUNDS = int(os.getenv('FL_ROUNDS', 10))
    FL_LOCAL_EPOCHS = int(os.getenv('FL_LOCAL_EPOCHS', 5))
    FL_AGGREGATION_STRATEGY = 'fedavg'

    # ── Emergency ──
    EMERGENCY_SIGNS = ['help', 'emergency', 'pain', 'danger', 'fire',
                       'police', 'hospital', 'accident', 'sick', 'hurt']
    EMERGENCY_EMOTION_BOOST = ['urgency', 'fear', 'anger']

    # ── Performance ──
    MAX_FPS = 30
    USE_GPU = os.getenv('USE_GPU', 'false').lower() == 'true'
    NUM_INFERENCE_THREADS = int(os.getenv('NUM_INFERENCE_THREADS', 4))

    # ── Offline ──
    OFFLINE_MODE_ENABLED = True
    SYNC_INTERVAL_SECONDS = 300

    # ── Logging ──
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'isl_system.log')

    # ── User Profiles ──
    MAX_SIGNER_PROFILES = 10
    ADAPTIVE_INFERENCE = True


class DevelopmentConfig(Config):
    DEBUG = True
    LOG_LEVEL = 'DEBUG'


class ProductionConfig(Config):
    DEBUG = False
    LOG_LEVEL = 'WARNING'


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
}


def get_config():
    """Return the config object matching FLASK_ENV."""
    env = os.getenv('FLASK_ENV', 'development')
    return config_map.get(env, DevelopmentConfig)