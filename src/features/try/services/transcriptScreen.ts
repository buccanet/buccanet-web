/**
 * The room messages a turn leaves out when AI Connect's guard stops the turn's prompt. Each recent
 * message is checked on its own, through the core's prompt for that message alone, so the reason
 * comes from the guard itself. When the prompt was too long, a message over the per message
 * length cap is left out as well.
 */

import {
  DEFAULT_MAX_INPUT_LENGTH, type ChatGuard, type QuestionStop, type QuestionVerdict,
} from '@tensorpass/aiconnect';

import type { ChatMessage } from '@/sdk/types';

/** Why a message of the room was left out of a turn. */
export type LeftOutReason = 'too-long' | 'encoded' | 'injection';

export interface Screened {
  kept: ChatMessage[];
  leftOut: LeftOutReason[];
}

/** The longest message the agent reads, the cap the core applies to each message of its prompt. */
const MESSAGE_CAP = DEFAULT_MAX_INPUT_LENGTH;

const reasonOf = (verdict: QuestionVerdict): LeftOutReason | null => {
  if (verdict.ok) {
    return null;
  }
  if (verdict.reason === 'injection') {
    return verdict.pattern === 'base64-blob' ? 'encoded' : 'injection';
  }
  return verdict.reason === 'too-long' ? 'too-long' : null;
};

export interface ScreenInput {
  guard: ChatGuard;
  /** Why the guard stopped the turn's prompt. */
  stop: QuestionStop;
  messages: readonly ChatMessage[];
  /** The user part of the core's prompt for the messages it receives. */
  promptOf: (messages: ChatMessage[]) => string;
}

/** Splits the messages into those the turn keeps and the reasons of those it leaves out. */
export const screenTranscript = ({ guard, stop, messages, promptOf }: ScreenInput): Screened => {
  const screened: Screened = { kept: [], leftOut: [] };
  for (const message of messages) {
    const capped = stop === 'too-long' && message.text.length > MESSAGE_CAP;
    const reason = capped ? 'too-long' : reasonOf(guard.checkQuestion(promptOf([message])));
    if (reason) {
      screened.leftOut.push(reason);
    } else {
      screened.kept.push(message);
    }
  }
  return screened;
};
