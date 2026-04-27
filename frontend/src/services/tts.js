/**
 * Client-side TTS helper.  Falls back to browser SpeechSynthesis if the
 * backend audio payload is unavailable.
 */

export function playAudioBase64(base64Audio) {
  if (!base64Audio) return;
  const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
  audio.play().catch((err) => console.warn('Audio play blocked:', err));
}

export function speakBrowser(text, lang = 'en') {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const langMap = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN' };
  utterance.lang = langMap[lang] || 'en-IN';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}