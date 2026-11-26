/**
 * A Buccanet device of this browser. A session owns one wasm client, persists its state under
 * its own IndexedDB key, and exposes a snapshot React reads with useSyncExternalStore. Only one
 * tab holds a device (navigator.locks); others show that it is open elsewhere. The page has two
 * sessions: the person's device, and the agent device a visitor runs in the Try it room.
 */

import init, { BuccanetClient } from './pkg/buccanet.js';
import { archiveState, loadState, saveState } from './storage';
import type { ChatMessage, ClientEvent, DeviceKind, PendingJoin, RoomInfo } from './types';

export {
  agentJoinCommand, agentPrompt, agentSilent, agentWakes, checkSecret, inviteMessage,
} from './pkg/buccanet.js';

export type SessionStatus = 'loading' | 'needs-device' | 'ready' | 'elsewhere' | 'failed';

export interface Snapshot {
  status: SessionStatus;
  me: { deviceId: string; name: string } | null;
  rooms: RoomInfo[];
  messages: Record<string, ChatMessage[]>;
  pending: PendingJoin[];
  live: boolean;
  notice: string | null;
  /** Why the stored device did not open, or why the relay forgot it. */
  failure: string | null;
}

export interface SessionOptions {
  /** The tab lock that keeps the device in one tab. */
  lockName: string;
  /** The IndexedDB key of the device's state. */
  storageKey: string;
}

type EventListener = (event: ClientEvent) => void;

/** The relay's answer for a well formed token whose device it no longer has. */
const DEVICE_UNKNOWN = 'device_unknown';

const FORGOTTEN = 'The relay no longer knows the device of this browser. Its keys are set aside in this browser, and you can create a new device.';

const failureOf = (error: unknown): string => `The relay could not open this device: ${error instanceof Error ? error.message : String(error)}`;

let wasm: Promise<unknown> | null = null;
const loadWasm = (): Promise<unknown> => {
  wasm ??= init();
  return wasm;
};

const relayUrl = (): string => window.location.origin;

export class DeviceSession {
  private client: BuccanetClient | null = null;
  private snapshot: Snapshot = {
    status: 'loading', me: null, rooms: [], messages: {}, pending: [], live: false, notice: null, failure: null,
  };
  private readonly listeners = new Set<() => void>();
  private readonly eventListeners = new Set<EventListener>();
  private booting: Promise<void> | null = null;

  constructor(private readonly options: SessionOptions) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): Snapshot => this.snapshot;

  /** Every event of the device, after the snapshot took it in. */
  listen = (listener: EventListener): (() => void) => {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  };

  requireClient = (): BuccanetClient => {
    if (!this.client) {
      throw new Error('The device is not ready yet.');
    }
    return this.client;
  };

  refreshRooms = async (): Promise<void> => {
    const rooms = (await this.requireClient().rooms()) as RoomInfo[];
    rooms.sort((a, b) => b.lastSeq - a.lastSeq);
    this.publish({ rooms });
  };

  refreshMessages = async (roomId: string): Promise<void> => {
    const list = (await this.requireClient().messages(roomId, 0)) as ChatMessage[];
    this.publish({ messages: { ...this.snapshot.messages, [roomId]: list } });
  };

  /** Holds the tab lock for the page's lifetime, then opens the stored device if there is one. Idempotent. */
  boot = (): Promise<void> => {
    this.booting ??= this.openDevice();
    return this.booting;
  };

  /** Opens the stored device again after a failure, under the tab lock the page already holds. */
  retry = async (): Promise<void> => {
    if (this.snapshot.status === 'failed') {
      this.publish({ status: 'loading', failure: null });
      await this.openStored();
    }
  };

  createDevice = async (name: string, kind: DeviceKind): Promise<void> => {
    const instance = await BuccanetClient.register(relayUrl(), name, kind, this.handleEvent, this.persist);
    await this.start(instance);
  };

  dismissNotice = (): void => this.publish({ notice: null });

  removePending = (requestId: string): void =>
    this.publish({ pending: this.snapshot.pending.filter((pending) => pending.requestId !== requestId) });

  private publish(patch: Partial<Snapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  /** Saves run in the order the client hands them over; a failed one is shown to the person. */
  private persist = (state: Uint8Array): void => {
    saveState(this.options.storageKey, state).catch((error: unknown) => {
      console.error('buccanet', error);
      this.publish({ notice: 'This browser could not save the device. Recent changes may be lost after a reload.' });
    });
  };

  private appendMessage(message: ChatMessage): void {
    const current = this.snapshot.messages[message.roomId] ?? [];
    if (current.some((item) => item.seq === message.seq)) {
      return;
    }
    const next = [...current, message].sort((a, b) => a.seq - b.seq);
    this.publish({ messages: { ...this.snapshot.messages, [message.roomId]: next } });
  }

  private onEvent(event: ClientEvent): void {
    switch (event.type) {
      case 'message':
        this.appendMessage(event.message);
        void this.refreshRooms();
        return;
      case 'joinRequested':
        this.publish({ pending: [...this.snapshot.pending.filter((p) => p.requestId !== event.request.requestId), event.request] });
        return;
      case 'joinedRoom':
      case 'roomUpdated':
      case 'leftRoom':
        void this.refreshRooms();
        return;
      case 'historyImported':
        void this.refreshMessages(event.roomId);
        this.publish({ notice: `${event.sharedBy} shared ${event.count} earlier ${event.count === 1 ? 'message' : 'messages'}.` });
        return;
      case 'joinRejected':
        this.publish({ notice: 'Your request to join was declined.' });
        return;
      case 'connection':
        this.publish({ live: event.live });
        return;
      case 'error':
        console.warn('buccanet', event.message);
    }
  }

  private handleEvent = (value: unknown): void => {
    const event = value as ClientEvent;
    this.onEvent(event);
    this.eventListeners.forEach((listener) => listener(event));
  };

  private async loadPending(): Promise<void> {
    const client = this.requireClient();
    const lists = await Promise.all(
      this.snapshot.rooms.filter((room) => room.admin).map((room) => client.pendingRequests(room.roomId) as Promise<PendingJoin[]>),
    );
    this.publish({ pending: lists.flat() });
  }

  private async start(instance: BuccanetClient): Promise<void> {
    this.client = instance;
    // Ready once the relay has accepted the device, so nothing acts for a device it refuses.
    await instance.sync();
    this.publish({ status: 'ready', me: { deviceId: instance.deviceId(), name: instance.name() }, failure: null });
    await this.refreshRooms();
    await Promise.all(this.snapshot.rooms.map((room) => this.refreshMessages(room.roomId)));
    await this.loadPending();
    void instance.run();
  }

  /**
   * Only the relay's `device_unknown` means the device is gone: its blob moves to an archive key
   * in this browser and the page offers a new device. Any other failure keeps the device and shows
   * the failure.
   */
  private onRestoreFailed = async (error: unknown): Promise<void> => {
    console.error('buccanet', error);
    this.client = null;
    if ((error as { code?: string } | null)?.code !== DEVICE_UNKNOWN) {
      this.publish({ status: 'failed', failure: failureOf(error) });
      return;
    }
    await archiveState(this.options.storageKey);
    this.publish({ status: 'needs-device', me: null, rooms: [], messages: {}, pending: [], failure: FORGOTTEN });
  };

  private async openStored(): Promise<void> {
    const stored = await loadState(this.options.storageKey);
    if (!stored) {
      this.publish({ status: 'needs-device' });
      return;
    }
    try {
      await this.start(BuccanetClient.restore(stored, this.handleEvent, this.persist));
    } catch (error) {
      await this.onRestoreFailed(error);
    }
  }

  private async openDevice(): Promise<void> {
    await loadWasm();
    await new Promise<void>((settled) => {
      void navigator.locks.request(this.options.lockName, { ifAvailable: true }, async (lock) => {
        if (!lock) {
          this.publish({ status: 'elsewhere' });
          settled();
          return;
        }
        await this.openStored();
        settled();
        await new Promise(() => {});
      });
    });
  }
}

/** The person's own device: their rooms, invites and joins. */
export const personSession = new DeviceSession({ lockName: 'buccanet-device', storageKey: 'state' });
