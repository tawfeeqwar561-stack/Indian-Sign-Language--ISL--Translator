/**
 * Redux middleware that intercepts actions to persist data offline
 * and queue network requests when the device is offline.
 */

import offlineStorage from '../../services/offlineStorage';

const offlineMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Save settings changes to IndexedDB
  if (action.type === 'settings/updateSetting' || action.type === 'settings/updateSettings') {
    const currentSettings = store.getState().settings;
    offlineStorage.saveSettings(currentSettings);
  }

  // When a chat message is added while offline, queue for later sync
  if (action.type === 'chat/addMessage' && !navigator.onLine) {
    const message = action.payload;
    if (message.type === 'text') {
      offlineStorage.queueForSync({
        type: 'conversation_log',
        data: {
          text: message.text,
          language: message.language,
          direction: 'text_to_isl',
        },
      });
    }
  }

  // Log translation results for offline history
  if (action.type === 'translation/setLastResult') {
    const sessionId = action.payload?.session_id;
    if (sessionId && action.payload?.gesture?.is_confident) {
      offlineStorage.saveMessage(sessionId, {
        sign: action.payload.gesture.sign,
        emotion: action.payload.emotion?.emotion || 'neutral',
        texts: action.payload.translation?.texts,
        isEmergency: action.payload.translation?.is_emergency,
      });
    }
  }

  return result;
};

export default offlineMiddleware;