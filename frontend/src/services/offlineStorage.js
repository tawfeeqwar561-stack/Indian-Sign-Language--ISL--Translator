/**
 * Offline storage using localForage (IndexedDB wrapper).
 * Stores conversation history and pending syncs.
 */

import localforage from 'localforage';

const conversationStore = localforage.createInstance({ name: 'isl_conversations' });
const settingsStore = localforage.createInstance({ name: 'isl_settings' });
const syncQueue = localforage.createInstance({ name: 'isl_sync_queue' });

export const offlineStorage = {
  // Conversation
  async saveMessage(sessionId, message) {
    const key = `session_${sessionId}`;
    const existing = (await conversationStore.getItem(key)) || [];
    existing.push({ ...message, savedAt: Date.now() });
    await conversationStore.setItem(key, existing);
  },

  async getMessages(sessionId) {
    return (await conversationStore.getItem(`session_${sessionId}`)) || [];
  },

  async clearSession(sessionId) {
    await conversationStore.removeItem(`session_${sessionId}`);
  },

  // Settings
  async saveSettings(settings) {
    await settingsStore.setItem('user_settings', settings);
  },

  async loadSettings() {
    return await settingsStore.getItem('user_settings');
  },

  // Sync queue (for offline → online sync)
  async queueForSync(item) {
    const queue = (await syncQueue.getItem('pending')) || [];
    queue.push({ ...item, queuedAt: Date.now() });
    await syncQueue.setItem('pending', queue);
  },

  async getPendingSync() {
    return (await syncQueue.getItem('pending')) || [];
  },

  async clearSyncQueue() {
    await syncQueue.setItem('pending', []);
  },
};

export default offlineStorage;