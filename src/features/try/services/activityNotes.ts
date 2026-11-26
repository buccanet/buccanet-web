/** The lines the visitor's agent writes in its activity, from what a turn ended with. */

import type { QuestionStop } from '@tensorpass/aiconnect';

import { TURNS_PER_HOUR } from '../constants/agentBudget';
import type { TurnOutcome } from './agentTurn';
import type { LeftOutReason } from './transcriptScreen';

export type ActivityKind = 'asked' | 'answered' | 'quiet' | 'held' | 'waiting' | 'error';

export const OUTCOME_NOTES: Record<TurnOutcome['kind'], [ActivityKind, string]> = {
  answer: ['answered', 'Your agent answered in the room.'],
  silent: ['quiet', 'Your agent read the room and stayed quiet.'],
  secret: ['held', 'Your agent wrote something shaped like a key, so the message was not sent.'],
};

export const BURST_NOTE = 'The agents here reached their limit of messages in a row. Your agent waits until a person writes.';

export const OFFLINE_NOTE = 'Your AI is not connected, so your agent cannot answer.';

const QUESTION_STOPS: Record<QuestionStop, string> = {
  'injection': 'The recent messages of the room read like an attempt to steer your agent, so it stayed quiet.',
  'too-long': 'The recent messages of the room are too long for your agent to read, so it stayed quiet.',
  'empty': 'The room had nothing for your agent to read, so it stayed quiet.',
};

/** The guard stopped the turn's prompt and the turn could not leave the stop behind. */
export const questionStopNote = (reason: QuestionStop): string => QUESTION_STOPS[reason];

const LEFT_OUT: Record<LeftOutReason, string> = {
  'too-long': 'too long to read',
  'encoded': 'holding a long encoded block',
  'injection': 'that read like an attempt to steer it',
};

/** The messages a turn left out, counted by reason. */
export const leftOutNote = (reasons: readonly LeftOutReason[]): string => {
  const counts = new Map<LeftOutReason, number>();
  reasons.forEach((reason) => counts.set(reason, (counts.get(reason) ?? 0) + 1));
  const parts = [...counts].map(([reason, count]) => `${count} ${LEFT_OUT[reason]}`);
  const noun = reasons.length === 1 ? 'message' : 'messages';
  return `Your agent left ${reasons.length} ${noun} of the room out of its reading: ${parts.join(', ')}.`;
};

const clockTime = (at: number): string => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const budgetNote = (resumeAt: number): string =>
  `Your agent used its ${TURNS_PER_HOUR} turns of this hour on your AI plan. It reads the room again at ${clockTime(resumeAt)}.`;
