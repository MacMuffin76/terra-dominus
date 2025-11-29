import { getLogger } from './logger';

const logger = getLogger('SafeStorage');
const memoryStore = new Map();

const isStorageAccessible = () => {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, 'ok');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    logger.warn('localStorage is not accessible; falling back to in-memory store.', err);
    return false;
  }
};

const storageAvailable = isStorageAccessible();

const getLocalStorage = () => (storageAvailable ? window.localStorage : null);

export const safeStorage = {
  getItem(key) {
    const store = getLocalStorage();
    if (store) {
      try {
        return store.getItem(key);
      } catch (err) {
        logger.warn('Unable to read from localStorage; using fallback store.', { key, error: err.message });
      }
    }
    return memoryStore.get(key) ?? null;
  },
  setItem(key, value) {
    const store = getLocalStorage();
    if (store) {
      try {
        store.setItem(key, value);
        return;
      } catch (err) {
        logger.warn('Unable to write to localStorage; using fallback store.', { key, error: err.message });
      }
    }
    memoryStore.set(key, value);
  },
  removeItem(key) {
    const store = getLocalStorage();
    if (store) {
      try {
        store.removeItem(key);
      } catch (err) {
        logger.warn('Unable to remove from localStorage; updating fallback store.', { key, error: err.message });
      }
    }
    memoryStore.delete(key);
  },
};

export default safeStorage;