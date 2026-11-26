/**
 * How the agent device gets into the Try it room: it reads the listing, and asks to join unless
 * it is a member already. The admission service lets it in within seconds; past the wait, the
 * service is taken to be offline.
 */

import type { DeviceSession } from '@/sdk/session';
import type { ClientEvent, JoinPending, ListingView, RoomInfo } from '@/sdk/types';

import { TRY_SLUG } from '../api/agentSession';

const ADMISSION_WAIT_MS = 20_000;

/** The relay's answer to a join request when the room has no free seat. */
const ROOM_FULL = 'room_full';

export type EntryFailure = 'offline' | 'refused' | 'full';

const ENTRY_ERRORS: Record<EntryFailure, string> = {
  offline: 'The room did not let the agent in.',
  refused: 'The room turned the agent down.',
  full: 'The room has no free seat.',
};

export class EntryError extends Error {
  constructor(readonly reason: EntryFailure) {
    super(ENTRY_ERRORS[reason]);
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

/** Asks to join the listed room; a room with no free seat fails the entry with `full`. */
const askToJoin = async (session: DeviceSession): Promise<JoinPending> => {
  try {
    return (await session.requireClient().joinListing(TRY_SLUG)) as JoinPending;
  } catch (error: unknown) {
    if ((error as { code?: string } | null)?.code === ROOM_FULL) {
      throw new EntryError('full');
    }
    throw error;
  }
};

/** The id of the Try it room, once the agent device is a member of it. */
export const enterRoom = async (session: DeviceSession): Promise<string> => {
  const client = session.requireClient();
  const listing = (await client.listing(TRY_SLUG)) as ListingView;
  if (await isMember(session, listing.roomId)) {
    return listing.roomId;
  }
  const pending = await askToJoin(session);
  await admitted(session, pending);
  await session.refreshRooms();
  return pending.roomId;
};

let entering: Promise<string> | null = null;

/** Forgets the room entered, so the next call joins again: the device left it, or was removed as idle. */
export const forgetEntry = (): void => {
  entering = null;
};

/** Enters the room once per page; a failed attempt can be tried again. */
export const enterRoomOnce = (session: DeviceSession): Promise<string> => {
  entering ??= enterRoom(session).catch((error: unknown) => {
    entering = null;
    throw error;
  });
  return entering;
};
