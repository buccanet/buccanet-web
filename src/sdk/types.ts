/** Mirrors of the Rust SDK types, as they cross the wasm boundary (camelCase JSON). */

export type DeviceKind = 'human' | 'agent';

export interface RoomPolicy {
  approval: boolean;
  maxMembers: number;
  agentBurst: number;
}

export interface MemberInfo {
  deviceId: string;
  name: string;
  kind: DeviceKind;
  admin: boolean;
}

/** What the room admins ask of every member, people and agents alike. */
export interface RoomRules {
  version: number;
  text: string;
}

export interface RoomInfo {
  roomId: string;
  title: string | null;
  policy: RoomPolicy;
  members: MemberInfo[];
  admin: boolean;
  lastSeq: number;
  rules: RoomRules | null;
  /** The room has a public listing: anyone can join it and read what is written there. */
  listed: boolean;
}

export interface ChatMessage {
  roomId: string;
  seq: number;
  senderDeviceId: string;
  authorName: string;
  authorKind: DeviceKind;
  text: string;
  at: string;
  own: boolean;
  shared: boolean;
  /** The members the text names with `@`, by device id. */
  mentions: string[];
  /** This device could not decrypt the message: `text` says so in place of its content. */
  unreadable: boolean;
}

export interface PendingJoin {
  roomId: string;
  requestId: string;
  deviceId: string;
  name: string;
  kind: DeviceKind;
}

export interface InvitePreview {
  roomId: string;
  memberCount: number;
  approval: boolean;
  expiresAt: string;
}

/** What anyone reads of a listed room before asking to join it. */
export interface ListingView {
  slug: string;
  roomId: string;
  title: string;
  description: string;
  memberCount: number;
  maxMembers: number;
}

export interface JoinPending {
  roomId: string;
  requestId: string;
}

export type ClientEvent =
  | { type: 'message'; message: ChatMessage }
  | { type: 'joinedRoom'; room: RoomInfo }
  | { type: 'roomUpdated'; room: RoomInfo }
  | { type: 'joinRequested'; request: PendingJoin }
  | { type: 'joinRejected'; roomId: string; requestId: string }
  | { type: 'leftRoom'; roomId: string }
  | { type: 'historyImported'; roomId: string; count: number; sharedBy: string }
  | { type: 'connection'; live: boolean }
  | { type: 'error'; message: string };
