import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import type { ConnectionState, VisitorBrowser } from '@tensorpass/aiconnect';

import type { Snapshot } from '@/sdk/session';

import { agentSession } from '../api/agentSession';
import { wallet } from '../api/wallet';
import { WALLET_BROWSERS } from '../constants/walletBrowsers';
import { createAgentDevice } from '../services/agentDevice';
import { EntryError, enterRoomOnce, forgetEntry, type EntryFailure } from '../services/roomEntry';
import { useWallet } from './useWallet';

/** Where a visitor stands on the way into the Try it room. */
export type TryStep =
  | { kind: 'checking' }
  | { kind: 'elsewhere' }
  | { kind: 'unsupported' }
  | { kind: 'install'; browser: VisitorBrowser; installUrl: string }
  | { kind: 'connect'; error: string | null }
  | { kind: 'connecting' }
  | { kind: 'joining' }
  | { kind: 'failed'; reason: EntryFailure | 'device' }
  | { kind: 'inside'; roomId: string };

type Failure = EntryFailure | 'device';

interface StepInput {
  snapshot: Snapshot;
  connection: ConnectionState;
  roomId: string | null;
  failure: Failure | null;
}

/** The wallet's part, for a visitor whose agent device does not exist yet. */
const walletStep = (connection: ConnectionState): TryStep => {
  const { browser, installUrl } = wallet();
  switch (connection.status) {
    case 'checking':
      return { kind: 'checking' };
    case 'noWallet':
    case 'signingIn':
      return WALLET_BROWSERS.has(browser) ? { kind: 'install', browser, installUrl } : { kind: 'unsupported' };
    case 'connecting':
      return { kind: 'connecting' };
    case 'connected':
      return { kind: 'joining' };
    case 'error':
      return { kind: 'connect', error: connection.message };
    case 'disconnected':
      return { kind: 'connect', error: null };
  }
};

export const stepOf = ({ snapshot, connection, roomId, failure }: StepInput): TryStep => {
  if (failure) {
    return { kind: 'failed', reason: failure };
  }
  switch (snapshot.status) {
    case 'loading':
      return { kind: 'checking' };
    case 'elsewhere':
      return { kind: 'elsewhere' };
    case 'failed':
      return { kind: 'failed', reason: 'device' };
    case 'needs-device':
      return walletStep(connection);
    case 'ready':
      return roomId ? { kind: 'inside', roomId } : { kind: 'joining' };
  }
};

/**
 * Walks the visitor in: the agent device opens or, once the visitor's AI is connected, is created,
 * then joins the listed room. A device made on an earlier visit goes straight to the room, and a
 * device removed from the room while the page is open, as idle, joins again.
 */
export const useTryEntry = (): { step: TryStep; retry: () => void } => {
  const snapshot = useSyncExternalStore(agentSession.subscribe, agentSession.getSnapshot);
  const connection = useWallet();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  useEffect(() => {
    void agentSession.boot();
  }, []);

  useEffect(() => {
    if (snapshot.status === 'needs-device' && connection.status === 'connected' && !failure) {
      createAgentDevice().catch((error: unknown) => {
        console.error('buccanet', error);
        setFailure('device');
      });
    }
  }, [snapshot.status, connection.status, failure]);

  useEffect(() => {
    if (snapshot.status !== 'ready' || roomId || failure) {
      return;
    }
    enterRoomOnce(agentSession).then(setRoomId, (error: unknown) => {
      setFailure(error instanceof EntryError ? error.reason : 'offline');
    });
  }, [snapshot.status, roomId, failure]);

  useEffect(
    () => agentSession.listen((event) => {
      if (event.type === 'leftRoom' && event.roomId === roomId) {
        forgetEntry();
        setRoomId(null);
      }
    }),
    [roomId],
  );

  const retry = useCallback(() => setFailure(null), []);
  return { step: stepOf({ snapshot, connection, roomId, failure }), retry };
};
