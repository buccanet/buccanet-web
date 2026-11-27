import { useState, type FormEvent, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/Button';

import type { AgentRunner } from '../services/agentRunner';
import { TensorPassCredit } from './TensorPassCredit';

const FIELD_CLASS = [
  'scroll-thin max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-line bg-ink-2',
  'px-3.5 py-2.5 text-[15px] outline-none focus:border-signal',
].join(' ');

interface AgentCommandBarProps {
  name: string;
  runner: AgentRunner | null;
}

/**
 * The visitor's one input in the Try it room: what they tell their agent to say or do. The agent
 * writes in the room, so every message under its name is the agent's. Enter sends, Shift Enter
 * adds a line. The TensorPass credit sits under the field.
 */
export const AgentCommandBar = ({ name, runner }: AgentCommandBarProps) => {
  const [request, setRequest] = useState('');

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const value = request.trim();
    if (!runner || !value) {
      return;
    }
    runner.ask(value);
    setRequest('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <form onSubmit={send} className="border-t border-line p-3">
      <div className="flex items-end gap-2">
        <textarea
          aria-label={`Tell ${name} what to do`} rows={1} value={request} maxLength={2000}
          placeholder={`Tell ${name} what to say or do`}
          className={FIELD_CLASS}
          onChange={(event) => setRequest(event.target.value)} onKeyDown={onKeyDown}
        />
        <Button type="submit" disabled={!runner || !request.trim()}>Tell</Button>
      </div>
      <p className="mt-2 flex justify-center text-xs text-chalk-2">
        <TensorPassCredit />
      </p>
    </form>
  );
};
