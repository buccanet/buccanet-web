/**
 * Device blobs live in IndexedDB: one database, one store, one key per device of this browser
 * (the person's device, and the agent device of the Try it room). The page keeps one open
 * connection and writes through an ordered queue, so an older blob never lands after a newer one.
 * A device the relay forgot keeps its blob under an archive key beside it, and the store keeps the
 * latest few archives of each device.
 */

const DB_NAME = 'buccanet';
const STORE = 'device';
const ARCHIVES_KEPT = 3;

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

const read = async (key: string): Promise<unknown> => {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/** Resolves once the transaction commits, so a resolved save is on disk. */
const write = async (key: string, state: Uint8Array): Promise<void> => {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(state, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('The save was aborted.'));
  });
};

let queue: Promise<void> = Promise.resolve();

export const loadState = async (key: string): Promise<Uint8Array | null> => {
  const value = (await read(key)) as Uint8Array | undefined;
  return value ?? null;
};

const archivePrefix = (key: string): string => `${key}-forgotten-`;

/** The archive keys of a device beyond the latest ones kept, oldest first. */
const surplusArchives = (keys: readonly string[], key: string): string[] => {
  const prefix = archivePrefix(key);
  const stamp = (archive: string): number => Number(archive.slice(prefix.length));
  const archives = keys.filter((candidate) => candidate.startsWith(prefix) && Number.isFinite(stamp(candidate)));
  archives.sort((a, b) => stamp(a) - stamp(b));
  return archives.slice(0, Math.max(0, archives.length - ARCHIVES_KEPT));
};

/** Moves the blob to its archive key and drops the oldest archives, in one transaction. */
const moveToArchive = (db: IDBDatabase, key: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    const blob = store.get(key);
    blob.onsuccess = () => {
      if (blob.result !== undefined) {
        store.put(blob.result, `${archivePrefix(key)}${Date.now()}`);
      }
      store.delete(key);
      const keys = store.getAllKeys();
      keys.onsuccess = () => surplusArchives(keys.result.map(String), key).forEach((archive) => store.delete(archive));
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('The archive was aborted.'));
  });

/** Sets a device's blob aside under its archive key, behind every queued save so none writes it back. */
export const archiveState = (key: string): Promise<void> => {
  const archived = queue.then(async () => moveToArchive(await database(), key));
  queue = archived.catch(() => undefined);
  return archived;
};

/** Queues the blob behind every earlier save. A failed save rejects its own promise and leaves the queue running. */
export const saveState = (key: string, state: Uint8Array): Promise<void> => {
  const saved = queue.then(() => write(key, state));
  queue = saved.catch(() => undefined);
  return saved;
};
