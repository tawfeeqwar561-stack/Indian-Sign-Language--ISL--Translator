import { useEffect, useRef } from 'react';
import offlineStorage from '../services/offlineStorage';
import api from '../services/api';

export function useOfflineSync(intervalMs = 60000) {
  const timerRef = useRef(null);

  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;

      try {
        const pending = await offlineStorage.getPendingSync();
        if (pending.length === 0) return;

        for (const item of pending) {
          if (item.type === 'fl_update') {
            await fetch('/api/federated/submit-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item),
            });
          }
          if (item.type === 'conversation_log') {
            await fetch('/api/translate/text-to-isl', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            });
          }
        }

        await offlineStorage.clearSyncQueue();
        console.log(`Synced ${pending.length} pending items`);
      } catch (err) {
        console.warn('Sync failed, will retry:', err);
      }
    };

    timerRef.current = setInterval(sync, intervalMs);
    sync(); // Immediate first attempt

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [intervalMs]);

  const isOnline = () => navigator.onLine;

  const forcSync = async () => {
    if (!navigator.onLine) return false;
    const pending = await offlineStorage.getPendingSync();
    if (pending.length === 0) return true;
    try {
      for (const item of pending) {
        await fetch('/api/federated/submit-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }
      await offlineStorage.clearSyncQueue();
      return true;
    } catch {
      return false;
    }
  };

  return { isOnline, forcSync };
}