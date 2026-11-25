/** The agent device a visitor runs in the Try it room: its own state key and tab lock, apart from the person's device. */

import { DeviceSession } from '@/sdk/session';

export const agentSession = new DeviceSession({ lockName: 'buccanet-try-agent', storageKey: 'try-agent-state' });

/** The listing the Try it room is found by. */
export const TRY_SLUG = 'demo';
