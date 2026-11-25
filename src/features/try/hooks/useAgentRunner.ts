import { useEffect, useState, useSyncExternalStore } from 'react';

import { agentSession } from '../api/agentSession';
import { AgentRunner, type RunnerState } from '../services/agentRunner';

const IDLE: RunnerState = { paused: false, busy: false, activity: [] };
const noSubscription = (): (() => void) => () => undefined;

/** Runs the visitor's agent in the room while the page is open. */
export const useAgentRunner = (roomId: string): { runner: AgentRunner | null; state: RunnerState } => {
  const [runner, setRunner] = useState<AgentRunner | null>(null);

  useEffect(() => {
    const created = new AgentRunner(agentSession, roomId);
    const stop = created.start();
    setRunner(created);
    return () => {
      stop();
      setRunner(null);
    };
  }, [roomId]);

  const state = useSyncExternalStore(runner?.subscribe ?? noSubscription, runner?.getState ?? (() => IDLE));
  return { runner, state };
};
