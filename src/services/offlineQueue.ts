import { WSClientMessage } from '../types';

const DB_NAME = 'safeband_offline_db';
const STORE_NAME = 'message_queue';
const DB_VERSION = 1;

export interface QueuedMessage {
  id?: number;
  timestamp: string;
  message: WSClientMessage;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOfflineMessage(message: WSClientMessage): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item: QueuedMessage = {
      timestamp: new Date().toISOString(),
      message
    };
    store.add(item);
    
    // Attempt Background Sync registration if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((reg: any) => {
        reg.sync?.register('safeband-flush-sos').catch(() => {});
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[OfflineQueue] Failed to enqueue to IndexedDB:', err);
  }
}

export async function getQueuedOfflineMessages(): Promise<QueuedMessage[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeQueuedOfflineMessage(id: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (err) {
    console.warn('[OfflineQueue] Failed to delete item:', err);
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('[OfflineQueue] Failed to clear queue:', err);
  }
}
