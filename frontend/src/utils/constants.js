export const CAMERA_FPS = 15;

export const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧', locale: 'en-IN' },
  ta: { name: 'Tamil', flag: '🇮🇳', locale: 'ta-IN' },
  hi: { name: 'Hindi', flag: '🇮🇳', locale: 'hi-IN' },
};

export const EMOTION_COLORS = {
  happiness: '#34d399',
  sadness: '#60a5fa',
  anger: '#f87171',
  neutral: '#94a3b8',
  urgency: '#fb923c',
  fear: '#c084fc',
  surprise: '#fbbf24',
};

export const DETECTION_STATES = {
  IDLE: 'idle',
  DETECTING: 'detecting',
  RECOGNIZED: 'recognized',
};