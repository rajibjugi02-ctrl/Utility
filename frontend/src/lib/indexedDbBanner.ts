// IndexedDB Local Storage for User Profile Media (Video Banner & Custom Avatar)

const DB_NAME = 'NeoUtilityMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'profile_media';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
}

export async function saveBannerMedia(file: File | Blob): Promise<{ url: string; isVideo: boolean }> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const isVideo = file.type.startsWith('video/');
    const record = {
      blob: file,
      type: file.type,
      isVideo,
      updatedAt: Date.now(),
    };

    const putRequest = store.put(record, 'hero_banner');
    putRequest.onsuccess = () => {
      const url = URL.createObjectURL(file);
      resolve({ url, isVideo });
    };
    putRequest.onerror = (e: any) => reject(e.target.error);
  });
}

export async function loadBannerMedia(): Promise<{ url: string; isVideo: boolean } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get('hero_banner');

      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result && result.blob) {
          const url = URL.createObjectURL(result.blob);
          resolve({ url, isVideo: result.isVideo });
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function removeBannerMedia(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delRequest = store.delete('hero_banner');
      delRequest.onsuccess = () => resolve();
      delRequest.onerror = (e: any) => reject(e.target.error);
    });
  } catch {}
}

export async function saveCustomAvatar(file: File | Blob): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putRequest = store.put({ blob: file, type: file.type }, 'custom_avatar');

    putRequest.onsuccess = () => {
      const url = URL.createObjectURL(file);
      resolve(url);
    };
    putRequest.onerror = (e: any) => reject(e.target.error);
  });
}

export async function loadCustomAvatar(): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get('custom_avatar');

      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result && result.blob) {
          resolve(URL.createObjectURL(result.blob));
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
