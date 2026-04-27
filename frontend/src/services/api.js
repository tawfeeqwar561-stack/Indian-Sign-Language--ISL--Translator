/**
 * REST API client for the ISL Translation backend.
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Health
  health: () => request('/health'),
  metrics: () => request('/metrics'),

  // Translation
  translateFrame: (frameBase64, language = 'en', sessionId = null) =>
    request('/translate/frame', {
      method: 'POST',
      body: JSON.stringify({ frame: frameBase64, language, session_id: sessionId }),
    }),

  textToISL: (text, language = 'en', sessionId = null) =>
    request('/translate/text-to-isl', {
      method: 'POST',
      body: JSON.stringify({ text, language, session_id: sessionId }),
    }),

  // TTS
  synthesize: (text, language = 'en', emotion = 'neutral') =>
    request('/tts', {
      method: 'POST',
      body: JSON.stringify({ text, language, emotion }),
    }),

  // Disambiguation
  disambiguate: (sessionId, selectedSign, language, emotion, emotionConfidence) =>
    request('/disambiguate', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        selected_sign: selectedSign,
        language, emotion,
        emotion_confidence: emotionConfidence,
      }),
    }),

  // Conversation
  getConversation: (sessionId, page = 1, perPage = 50) =>
    request(`/conversation/${sessionId}?page=${page}&per_page=${perPage}`),

  // Profiles
  createProfile: (profileData) =>
    request('/profile', { method: 'POST', body: JSON.stringify(profileData) }),

  getProfile: (userId) => request(`/profile/${userId}`),

  // Emergency
  confirmEmergency: (eventId, confirmed, action = '') =>
    request('/emergency/confirm', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, confirmed, action }),
    }),

  // Vocabulary & Languages
  getLanguages: () => request('/languages'),
  getVocabulary: () => request('/vocabulary'),

  // Pipeline reset
  resetPipeline: () => request('/reset', { method: 'POST' }),
};

export default api;