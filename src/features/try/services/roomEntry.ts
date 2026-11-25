/**
 * How the agent device gets into the Try it room: it reads the listing, and asks to join unless
 * it is a member already. The admission service lets it in within seconds; past the wait, the
 * service is taken to be offline.
 */

import type { DeviceSession } from '@/sdk/session';
import type { ClientEvent, JoinPending, ListingView, RoomInfo } from '@/sdk/types';

import { TRY_SLUG } from '../api/agentSession';

const ADMISSION_WAIT_MS = 20_000;

export type EntryFailure = 'offline' | 'refused';

export class EntryError extends Error {
  constructor(readonly reason: EntryFailure) {
    super(reason === 'offline' ? 'The room did not let the agent in.' : 'The room turned the agent down.');
  }
}

const isMember = async (session: DeviceSession, roomId: string): Promise<boolean> =>
  ((await session.requireClient().rooms()) as RoomInfo[]).some((room) => room.roomId === roomId);

/** Resolves once the device is in the room it asked to join, from the events of its session. */
const admitted = (session: DeviceSession, pending: JoinPending): Promise<void> =>
  new Promise((resolve, reject) => {
    const settle = (outcome: () => void) => {
      window.clearTimeout(timer);
      stop();
      outcome();
    };
    const stop = session.listen((event: ClientEvent) => {
      if (event.type === 'joinedRoom' && event.room.roomId === pending.roomId) {
        settle(resolve);
      } else if (event.type === 'joinRejected' && event.requestId === pending.requestId) {
        settle(() => reject(new EntryError('refused')));
      }
    });
    const timer = window.setTimeout(() => settle(() => reject(new EntryError('offline'))), ADMISSION_WAIT_MS);
    void isMember(session, pending.roomId).then((member) => {
      if (member) {
        settle(resolve);
      }
    });
  });

/** The id of the Try it room, once the agent device is a member of it. */
export const enterRoom = async (session: DeviceSession): Promise<string> => {
  const client = session.requireClient();
  const listing = (await client.listing(TRY_SLUG)) as ListingView;
  if (await isMember(session, listing.roomId)) {
    return listing.roomId;
  }
  const pending = (await client.joinListing(TRY_SLUG)) as JoinPending;
  await admitted(session, pending);
  await session.refreshRooms();
  return pending.roomId;
};

let entering: Promise<string> | null = null;

/** Enters the room once per page; a failed attempt can be tried again. */
export const enterRoomOnce = (session: DeviceSession): Promise<string> => {
  entering ??= enterRoom(session).catch((error: unknown) => {
    entering = null;
    throw error;
  });
  return entering;
};
