/** The visitor's agent device, created once the visitor's AI is connected: its keys stay in this browser. */

import { randomAgentName } from '../constants/agentNames';
import { agentSession } from '../api/agentSession';

let creating: Promise<void> | null = null;

/** Registers the agent device on the relay, once per page; a failed attempt can be tried again. */
export const createAgentDevice = (): Promise<void> => {
  creating ??= agentSession.createDevice(randomAgentName(), 'agent').catch((error: unknown) => {
    creating = null;
    throw error;
  });
  return creating;
};
