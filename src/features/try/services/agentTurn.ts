/**
 * One turn of the visitor's agent: the core's prompt for the recent room, the visitor's model
 * through the wallet under AI Connect's guards, with `list_members` for when it names someone,
 * then the core's checks on the answer. The answer is the message. `[SILENT]` keeps the agent
 * quiet. An answer shaped like a key, or one that repeats a long stretch of the visitor's
 * instructions, stays in the page.
 *
 * A turn is prepared before it reaches the model. When the guard stops its prompt, the messages
 * that trip the guard are left out and the prompt is checked once more; a second stop throws
 * `GuardStop`.
 */

import {
  createChatGuard, finalAnswer, GuardStop, runConversation, type ChatGuard, type ProviderSession,
} from '@tensorpass/aiconnect';

import { agentPrompt, agentSilent, checkSecret } from '@/sdk/session';
import type { ChatMessage, RoomInfo } from '@/sdk/types';

import { MAX_STEPS } from '../constants/agentBudget';
import { repeatsInstructions } from './instructionEcho';
import { memberTool } from './memberTool';
import { screenTranscript, type LeftOutReason } from './transcriptScreen';

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

/** A turn whose prompt passed the guard, ready for the model. */
export interface PreparedTurn {
  input: TurnInput;
  guard: ChatGuard;
  prompt: Prompt;
  leftOut: LeftOutReason[];
}

export type TurnOutcome =
  | { kind: 'answer'; text: string }
  | { kind: 'silent' }
  | { kind: 'secret'; rule: string }
  | { kind: 'echo' };

const promptOf = ({ me, room, instructions, request }: TurnInput, messages: ChatMessage[]): Prompt =>
  agentPrompt({
    deviceId: me.deviceId,
    name: me.name,
    roomId: room.roomId,
    roomTitle: room.title,
    public: room.listed,
    messages,
    instructions,
    request,
    rules: room.rules,
  }) as Prompt;

/** The turn's prompt under the guard, without the messages that trip it. A stop it cannot clear throws `GuardStop`. */
export const prepareTurn = (input: TurnInput): PreparedTurn => {
  const guard = createChatGuard(GUARD_POLICY);
  const recent = input.messages.slice(-TRANSCRIPT_MESSAGES);
  const prompt = promptOf(input, recent);
  const verdict = guard.checkQuestion(prompt.user);
  if (verdict.ok) {
    return { input, guard, prompt, leftOut: [] };
  }
  const { kept, leftOut } = screenTranscript({
    guard, stop: verdict.reason, messages: recent, promptOf: (messages) => promptOf(input, messages).user,
  });
  if (leftOut.length === 0) {
    throw new GuardStop('question', verdict.reason);
  }
  const screened = promptOf(input, kept);
  const second = guard.checkQuestion(screened.user);
  if (!second.ok) {
    throw new GuardStop('question', second.reason);
  }
  return { input, guard, prompt: screened, leftOut };
};

/** Asks the visitor's model for the agent's next message. A guard stop throws `GuardStop`. */
export const askModel = async (session: ProviderSession, { input, guard, prompt }: PreparedTurn): Promise<TurnOutcome> => {
  const added = await runConversation({
    session,
    messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
    tools: memberTool(input.room, input.me.deviceId),
    maxSteps: MAX_STEPS,
    maxToolCalls: 1,
    guard,
  });
  const text = finalAnswer(added)?.content.trim() ?? '';
  if (agentSilent(text)) {
    return { kind: 'silent' };
  }
  const rule = checkSecret(text);
  if (rule) {
    return { kind: 'secret', rule };
  }
  return repeatsInstructions(text, input.instructions) ? { kind: 'echo' } : { kind: 'answer', text };
};
