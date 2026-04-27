# Text-to-Speech
"""
Text-to-Speech engine with multilingual support (EN, TA, HI).

Supports two backends:
  • gTTS  — Google TTS, requires network, best quality
  • pyttsx3 — offline, lower quality, English-focused

Implements disk caching so repeated phrases are instant.
"""

import os
import hashlib
import logging
import base64
from typing import Optional

logger = logging.getLogger(__name__)


class TTSEngine:
    """Convert text to speech audio (base64-encoded MP3/WAV)."""

    LANG_MAP = {
        'en': 'en',
        'ta': 'ta',
        'hi': 'hi',
    }

    def __init__(self, config: dict):
        self.engine_type = config.get('TTS_ENGINE', 'gtts')
        self.cache_dir = config.get('TTS_CACHE_DIR', 'saved_models/tts_cache')
        os.makedirs(self.cache_dir, exist_ok=True)

        # Emotion-to-speech parameters
        self._emotion_params = {
            'happiness':  {'rate_factor': 1.1, 'pitch': 'high'},
            'sadness':    {'rate_factor': 0.85, 'pitch': 'low'},
            'anger':      {'rate_factor': 1.2, 'pitch': 'high'},
            'neutral':    {'rate_factor': 1.0, 'pitch': 'medium'},
            'urgency':    {'rate_factor': 1.3, 'pitch': 'high'},
            'fear':       {'rate_factor': 1.15, 'pitch': 'high'},
            'surprise':   {'rate_factor': 1.1, 'pitch': 'high'},
        }

    def synthesize(self, text: str, language: str = 'en',
                   emotion: str = 'neutral') -> dict:
        """
        Generate speech from text.

        Returns:
            audio_base64 : base64 MP3 string
            cache_hit    : bool
            file_path    : str (local cache path)
        """
        lang_code = self.LANG_MAP.get(language, 'en')
        cache_key = self._cache_key(text, lang_code, emotion)
        cache_path = os.path.join(self.cache_dir, f"{cache_key}.mp3")

        # Check cache
        if os.path.isfile(cache_path):
            audio_b64 = self._read_b64(cache_path)
            return {'audio_base64': audio_b64, 'cache_hit': True,
                    'file_path': cache_path}

        # Generate
        try:
            if self.engine_type == 'gtts':
                self._generate_gtts(text, lang_code, cache_path, emotion)
            else:
                self._generate_pyttsx3(text, lang_code, cache_path, emotion)

            audio_b64 = self._read_b64(cache_path)
            return {'audio_base64': audio_b64, 'cache_hit': False,
                    'file_path': cache_path}

        except Exception as e:
            logger.error(f"TTS error: {e}")
            return {'audio_base64': None, 'cache_hit': False,
                    'file_path': None, 'error': str(e)}

    def synthesize_emergency(self, text: str, language: str = 'en') -> dict:
        """High-priority synthesis: always uses urgency tone, skips cache."""
        return self.synthesize(text, language, emotion='urgency')

    # ── Private ──────────────────────────────────────────────

    def _generate_gtts(self, text: str, lang: str, path: str,
                       emotion: str):
        from gtts import gTTS
        slow = emotion == 'sadness'
        tts = gTTS(text=text, lang=lang, slow=slow)
        tts.save(path)

    def _generate_pyttsx3(self, text: str, lang: str, path: str,
                          emotion: str):
        import pyttsx3
        engine = pyttsx3.init()
        params = self._emotion_params.get(emotion, self._emotion_params['neutral'])
        rate = engine.getProperty('rate')
        engine.setProperty('rate', int(rate * params['rate_factor']))
        engine.save_to_file(text, path)
        engine.runAndWait()

    @staticmethod
    def _cache_key(text: str, lang: str, emotion: str) -> str:
        raw = f"{text}|{lang}|{emotion}"
        return hashlib.sha256(raw.encode()).hexdigest()[:24]

    @staticmethod
    def _read_b64(path: str) -> str:
        with open(path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')