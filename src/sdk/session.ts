/**
 * One Buccanet device per browser profile. This module owns the wasm client, persists its
 * state, and exposes a snapshot React reads with useSyncExternalStore. Only one tab holds
 * the device (navigator.locks); others show that the chat is open elsewhere.
 */

import init, { BuccanetClient } from './pkg/buccanet.js';
import { loadState, saveState } from './storage';
import type { ChatMessage, ClientEvent, DeviceKind, PendingJoin, RoomInfo } from './types';

export type SessionStatus = 'loading' | 'needs-device' | 'ready' | 'elsewhere' | 'failed';

export interface Snapshot {
  status: SessionStatus;
  me: { deviceId: string; name: string } | null;
  rooms: RoomInfo[];
  messages: Record<string, ChatMessage[]>;
  pending: PendingJoin[];
  live: boolean;
  notice: string | null;
}

const LOCK_NAME = 'buccanet-device';
const relayUrl = (): string => window.location.origin;

let client: BuccanetClient | null = null;
let snapshot: Snapshot = { status: 'loading', me: null, rooms: [], messages: {}, pending: [], live: false, notice: null };
const listeners = new Set<() => void>();

const publish = (patch: Partial<Snapshot>): void => {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = (): Snapshot => snapshot;

export const requireClient = (): BuccanetClient => {
  if (!client) {
    throw new Error('The device is not ready yet.');
  }
  return client;
};

const persist = (state: Uint8Array): void => {
  void saveState(state);
};

export const refreshRooms = async (): Promise<void> => {
  const rooms = (await requireClient().rooms()) as RoomInfo[];
  rooms.sort((a, b) => b.lastSeq - a.lastSeq);
  publish({ rooms });
};

export const refreshMessages = async (roomId: string): Promise<void> => {
  const list = (await requireClient().messages(roomId, 0)) as ChatMessage[];
  publish({ messages: { ...snapshot.messages, [roomId]: list } });
};

const appendMessage = (message: ChatMessage): void => {
  const current = snapshot.messages[message.roomId] ?? [];
  if (current.some((item) => item.seq === message.seq)) {
    return;
  }
  const next = [...current, message].sort((a, b) => a.seq - b.seq);
  publish({ messages: { ...snapshot.messages, [message.roomId]: next } });
};

const onEvent = (event: ClientEvent): void => {
  switch (event.type) {
    case 'message':
      appendMessage(event.message);
      void refreshRooms();
      return;
    case 'joinRequested':
      publish({ pending: [...snapshot.pending.filter((p) => p.requestId !== event.request.requestId), event.request] });
      return;
    case 'joinedRoom':
    case 'roomUpdated':
    case 'leftRoom':
      void refreshRooms();
      return;
    case 'historyImported':
      void refreshMessages(event.roomId);
      publish({ notice: `${event.sharedBy} shared ${event.count} earlier ${event.count === 1 ? 'message' : 'messages'}.` });
      return;
    case 'joinRejected':
      publish({ notice: 'Your request to join was declined.' });
      return;
    case 'connection':
      publish({ live: event.live });
      return;
    case 'error':
      console.warn('buccanet', event.message);
  }
};

const handleEvent = (value: unknown): void => onEvent(value as ClientEvent);

const loadPending = async (): Promise<void> => {
  const lists = await Promise.all(
    snapshot.rooms.filter((room) => room.admin).map((room) => requireClient().pendingRequests(room.roomId) as Promise<PendingJoin[]>),
  );
  publish({ pending: lists.flat() });
};

const start = async (instance: BuccanetClient): Promise<void> => {
  client = instance;
  publish({ status: 'ready', me: { deviceId: instance.deviceId(), name: instance.name() } });
  await instance.sync();
  await refreshRooms();
  await Promise.all(snapshot.rooms.map((room) => refreshMessages(room.roomId)));
  await loadPending();
  void instance.run();
};

let booting: Promise<void> | null = null;

/** Holds the tab lock for the page's lifetime, then opens the stored device if there is one. Idempotent. */
export const boot = (): Promise<void> => {
  booting ??= openDevice();
  return booting;
};

const openDevice = async (): Promise<void> => {
  await init();
  await new Promise<void>((settled) => {
    void navigator.locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => {
      if (!lock) {
        publish({ status: 'elsewhere' });
        settled();
        return;
      }
      const stored = await loadState();
      if (stored) {
        await start(BuccanetClient.restore(stored, handleEvent, persist)).catch(() => publish({ status: 'failed' }));
      } else {
        publish({ status: 'needs-device' });
      }
      settled();
      await new Promise(() => {});
    });
  });
};

export const createDevice = async (name: string, kind: DeviceKind = 'human'): Promise<void> => {
  const instance = await BuccanetClient.register(relayUrl(), name, kind, handleEvent, persist);
  await start(instance);
};

export const dismissNotice = (): void => publish({ notice: null });

export const removePending = (requestId: string): void =>
  publish({ pending: snapshot.pending.filter((pending) => pending.requestId !== requestId) });
