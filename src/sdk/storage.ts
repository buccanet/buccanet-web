/**
 * The device blob lives in IndexedDB: one database, one store, one key. The page keeps one
 * open connection and writes through an ordered queue, so an older blob never lands after a
 * newer one.
 */

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

let connection: Promise<IDBDatabase> | null = null;

/** Opens the database once and reopens it only after a failed open or a closed connection. */
const database = (): Promise<IDBDatabase> => {
  connection ??= open().then(
    (db) => {
      db.onclose = () => {
        connection = null;
      };
      db.onversionchange = () => {
        db.close();
        connection = null;
      };
      return db;
    },
    (error: unknown) => {
      connection = null;
      throw error;
    },
  );
  return connection;
};

const read = async (): Promise<unknown> => {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/** Resolves once the transaction commits, so a resolved save is on disk. */
const write = async (state: Uint8Array): Promise<void> => {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(state, KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('The save was aborted.'));
  });
};

let queue: Promise<void> = Promise.resolve();

export const loadState = async (): Promise<Uint8Array | null> => {
  const value = (await read()) as Uint8Array | undefined;
  return value ?? null;
};

/** Queues the blob behind every earlier save. A failed save rejects its own promise and leaves the queue running. */
export const saveState = (state: Uint8Array): Promise<void> => {
  const saved = queue.then(() => write(state));
  queue = saved.catch(() => undefined);
  return saved;
};
