/** The device blob lives in IndexedDB: one database, one store, one key. */

const DB_NAME = 'buccanet';
const STORE = 'device';
const KEY = 'state';

const open = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const run = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const loadState = async (): Promise<Uint8Array | null> => {
  const value = await run<Uint8Array | undefined>('readonly', (store) => store.get(KEY));
  return value ?? null;
};

export const saveState = (state: Uint8Array): Promise<IDBValidKey> => run('readwrite', (store) => store.put(state, KEY));
