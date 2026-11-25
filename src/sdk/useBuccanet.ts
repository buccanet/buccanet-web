import { createContext, useContext, useSyncExternalStore } from 'react';

import { personSession, type DeviceSession, type Snapshot } from './session';

/** The device the components below act as: the person's own, unless a page provides another. */
export const SessionContext = createContext<DeviceSession>(personSession);

export const useSession = (): DeviceSession => useContext(SessionContext);

export const useBuccanet = (): Snapshot => {
  const session = useSession();
  return useSyncExternalStore(session.subscribe, session.getSnapshot);
};
