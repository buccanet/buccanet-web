import { useSyncExternalStore } from 'react';

import type { ConnectionState } from '@tensorpass/aiconnect';

import { wallet } from '../api/wallet';

const subscribe = (listener: () => void): (() => void) => {
  const unsubscribe = wallet().subscribe(listener);
  return () => {
    unsubscribe();
  };
};

const current = (): ConnectionState => wallet().state;

/** The connection to the visitor's AI, as the wallet reports it. */
export const useWallet = (): ConnectionState => useSyncExternalStore(subscribe, current);
