/**
 * The visitor's agent at work while the Try it page is open. Every message of the room wakes it,
 * unless it names other members with `@`, and the agent decides itself whether to answer. Wakes
 * close together become one turn, and a wake waits out a cooldown after the last turn, whatever
 * that turn ended with. The visitor's own request runs at once. Every turn that reaches the
 * visitor's model counts against an hourly budget, and on the relay's agent burst refusal the agent
 * waits for a person to write.
 */

import { GuardStop } from '@tensorpass/aiconnect';

import { agentWakes, type DeviceSession } from '@/sdk/session';
import type { ChatMessage, RoomInfo } from '@/sdk/types';

import { sendText } from '../../chat/actions';
import { wallet } from '../api/wallet';
import { COOLDOWN_MS, HOUR_MS, MERGE_MS, TURNS_PER_HOUR } from '../constants/agentBudget';
import { runTurn, type TurnOutcome } from './agentTurn';

/** Messages older than this when they arrive, such as the ones missed while the page was closed, wake nobody. */
const BACKLOG_MS = 60_000;
const ACTIVITY_KEPT = 6;

export type ActivityKind = 'asked' | 'answered' | 'quiet' | 'held' | 'waiting' | 'error';

export interface Activity {
  id: number;
  at: number;
  kind: ActivityKind;
  text: string;
}

export interface RunnerState {
  paused: boolean;
  busy: boolean;
  activity: Activity[];
}

const OUTCOME_NOTES: Record<TurnOutcome['kind'], [ActivityKind, string]> = {
  answer: ['answered', 'Your agent answered in the room.'],
  silent: ['quiet', 'Your agent read the room and stayed quiet.'],
  secret: ['held', 'Your agent wrote something shaped like a key, so the message was not sent.'],
};

const BURST_NOTE = 'The agents here reached their limit of messages in a row. Your agent waits until a person writes.';

const clockTime = (at: number): string => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const budgetNote = (resumeAt: number): string =>
  `Your agent used its ${TURNS_PER_HOUR} turns of this hour on your AI plan. It reads the room again at ${clockTime(resumeAt)}.`;

export class AgentRunner {
  private state: RunnerState = { paused: false, busy: false, activity: [] };
  private readonly listeners = new Set<() => void>();
  private timer: number | null = null;
  private due = false;
  private request: string | null = null;
  private lastTurn = 0;
  /** When each turn of the last hour reached the model. */
  private turns: number[] = [];
  private burstHeld = false;
  private noteId = 0;
  private instructions = '';

  constructor(private readonly session: DeviceSession, private readonly roomId: string) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getState = (): RunnerState => this.state;

  /** Follows the room's messages until the returned function stops it. */
  start(): () => void {
    const stop = this.session.listen((event) => {
      if (event.type === 'message') {
        this.onMessage(event.message);
      }
    });
    return () => {
      stop();
      this.clearTimer();
    };
  }

  /** What the visitor asks of the agent in every turn. */
  setInstructions(text: string): void {
    this.instructions = text;
  }

  setPaused(paused: boolean): void {
    this.update({ paused });
    if (paused) {
      this.clearTimer();
      this.due = false;
    }
  }

  /** The visitor asks the agent to do something now. */
  ask(request: string): void {
    this.note('asked', `You asked: ${request}`);
    this.request = request;
    this.schedule(0);
  }

  private room(): RoomInfo | undefined {
    return this.session.getSnapshot().rooms.find((room) => room.roomId === this.roomId);
  }

  private onMessage(message: ChatMessage): void {
    if (message.roomId !== this.roomId) {
      return;
    }
    if (message.authorKind === 'human') {
      this.burstHeld = false;
    }
    const me = this.session.getSnapshot().me;
    const room = this.room();
    const recent = Date.now() - Date.parse(message.at) < BACKLOG_MS;
    if (me && room && recent && agentWakes(message, me.deviceId)) {
      this.schedule(this.nextDelay());
    }
  }

  /** A request of the visitor runs at once; a wake waits out the cooldown of the last turn. */
  private nextDelay(): number {
    return this.request === null ? Math.max(MERGE_MS, this.lastTurn + COOLDOWN_MS - Date.now()) : 0;
  }

  private schedule(delay: number): void {
    if (this.state.paused) {
      return;
    }
    this.due = true;
    if (this.state.busy) {
      return;
    }
    this.clearTimer();
    this.timer = window.setTimeout(() => void this.turn(), delay);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async turn(): Promise<void> {
    this.timer = null;
    const request = this.request;
    this.request = null;
    this.due = false;
    const blocked = this.blocked();
    if (blocked) {
      this.note('waiting', blocked);
      return;
    }
    this.update({ busy: true });
    try {
      await this.answer(request);
    } catch (error) {
      this.fail(error);
    } finally {
      this.lastTurn = Date.now();
      this.update({ busy: false });
      if (this.due) {
        this.schedule(this.nextDelay());
      }
    }
  }

  /** Why the agent cannot answer now, if it cannot. */
  private blocked(): string | null {
    this.turns = this.turns.filter((at) => Date.now() - at < HOUR_MS);
    if (this.burstHeld) {
      return BURST_NOTE;
    }
    const [oldest] = this.turns;
    if (oldest !== undefined && this.turns.length >= TURNS_PER_HOUR) {
      return budgetNote(oldest + HOUR_MS);
    }
    return wallet().state.status === 'connected' ? null : 'Your AI is not connected, so your agent cannot answer.';
  }

  private async answer(request: string | null): Promise<void> {
    const connection = wallet().state;
    const snapshot = this.session.getSnapshot();
    const room = this.room();
    if (connection.status !== 'connected' || !snapshot.me || !room) {
      return;
    }
    const messages = snapshot.messages[this.roomId] ?? [];
    this.turns.push(Date.now());
    const outcome = await runTurn(connection.session, { me: snapshot.me, room, messages, instructions: this.instructions, request });
    if (outcome.kind === 'answer') {
      await sendText(this.session, this.roomId, outcome.text);
    }
    const [kind, text] = OUTCOME_NOTES[outcome.kind];
    this.note(kind, outcome.kind === 'secret' ? `${text} Rule: ${outcome.rule}.` : text);
  }

  private fail(error: unknown): void {
    if (error instanceof GuardStop) {
      const text = error.stage === 'question'
        ? 'A message in the room read like an attempt to steer your agent, so it stayed quiet.'
        : `A guard stopped your agent's answer (${error.reason}).`;
      this.note('held', text);
      return;
    }
    if ((error as { code?: unknown }).code === 'agent_burst') {
      this.burstHeld = true;
      this.note('waiting', BURST_NOTE);
      return;
    }
    this.note('error', error instanceof Error ? error.message : String(error));
  }

  /** Adds a line to the activity. A line that repeats the newest one only moves its time. */
  private note(kind: ActivityKind, text: string): void {
    const [newest, ...older] = this.state.activity;
    if (newest && newest.kind === kind && newest.text === text) {
      this.update({ activity: [{ ...newest, at: Date.now() }, ...older] });
      return;
    }
    this.noteId += 1;
    const entry = { id: this.noteId, at: Date.now(), kind, text };
    this.update({ activity: [entry, ...this.state.activity].slice(0, ACTIVITY_KEPT) });
  }

  private update(patch: Partial<RunnerState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
}
