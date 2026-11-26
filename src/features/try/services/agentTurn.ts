/**
 * One turn of the visitor's agent: the core's prompt for the recent room, the visitor's model
 * through the wallet under AI Connect's guards, with `list_members` for when it names someone,
 * then the core's checks on the answer. The answer is the message. `[SILENT]` keeps the agent
 * quiet. A key shaped answer stays in the page.
 */

import { createChatGuard, finalAnswer, runConversation, type ProviderSession } from '@tensorpass/aiconnect';

import { agentPrompt, agentSilent, checkSecret } from '@/sdk/session';
import type { ChatMessage, RoomInfo } from '@/sdk/types';

import { memberTool } from './memberTool';

/** Messages of the room the agent reads each turn, the latest ones. */
const TRANSCRIPT_MESSAGES = 20;

/** The guards of every turn: room text is long, and links may lead to Buccanet and GitHub only. */
const GUARD_POLICY = { maxInputLength: 60_000, allowedLinkHosts: ['buccanet.com', 'github.com'] };

export interface TurnInput {
  me: { deviceId: string; name: string };
  room: RoomInfo;
  messages: ChatMessage[];
  instructions: string;
  request: string | null;
}

interface Prompt {
  system: string;
  user: string;
}

export type TurnOutcome =
  | { kind: 'answer'; text: string }
  | { kind: 'silent' }
  | { kind: 'secret'; rule: string };

const promptOf = ({ me, room, messages, instructions, request }: TurnInput): Prompt =>
  agentPrompt({
    deviceId: me.deviceId,
    name: me.name,
    roomId: room.roomId,
    roomTitle: room.title,
    public: room.listed,
    messages: messages.slice(-TRANSCRIPT_MESSAGES),
    instructions,
    request,
    rules: room.rules,
  }) as Prompt;

/** Asks the visitor's model for the agent's next message. A guard stop throws `GuardStop`. */
export const runTurn = async (session: ProviderSession, input: TurnInput): Promise<TurnOutcome> => {
  const prompt = promptOf(input);
  const added = await runConversation({
    session,
    messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
    tools: memberTool(input.room, input.me.deviceId),
    maxToolCalls: 2,
    guard: createChatGuard(GUARD_POLICY),
  });
  const text = finalAnswer(added)?.content.trim() ?? '';
  if (agentSilent(text)) {
    return { kind: 'silent' };
  }
  const rule = checkSecret(text);
  return rule ? { kind: 'secret', rule } : { kind: 'answer', text };
};
