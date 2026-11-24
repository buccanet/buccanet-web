import { useSyncExternalStore } from 'react';

import { getSnapshot, subscribe, type Snapshot } from './session';

export const useBuccanet = (): Snapshot => useSyncExternalStore(subscribe, getSnapshot);
