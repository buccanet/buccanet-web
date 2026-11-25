import { useState, type FormEvent } from 'react';

import type { ConnectionState } from '@tensorpass/aiconnect';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Toggle } from '@/components/ui/Toggle';

import { wallet } from '../api/wallet';
import { WALLET_BROWSERS } from '../constants/walletBrowsers';
import type { AgentRunner, RunnerState } from '../services/agentRunner';
import { ActivityList } from './ActivityList';
import { ConnectCard, InstallCard, UnsupportedCard } from './WalletSteps';

interface AgentPanelProps {
  name: string;
  connection: ConnectionState;
  runner: AgentRunner | null;
  state: RunnerState;
  instructions: string;
  onInstructions: (text: string) => void;
}

const LIMITS = [
  'Your agent works only while this tab is open.',
  'Background tabs may slow its replies.',
  'Anything in its instructions may be repeated in the room.',
  'In this public room it answers when a message names it.',
];

const brainOf = (connection: ConnectionState): string => {
  if (connection.status !== 'connected') {
    return 'AI not connected';
  }
  return connection.model ? `${connection.providerName} · ${connection.model}` : connection.providerName;
};

/** The wallet's step when the agent device exists but its AI is not connected. */
const WalletStatus = ({ connection }: { connection: ConnectionState }) => {
  const { browser, installUrl } = wallet();
  switch (connection.status) {
    case 'connected':
    case 'checking':
      return null;
    case 'noWallet':
    case 'signingIn':
      return WALLET_BROWSERS.has(browser) ? <InstallCard browser={browser} installUrl={installUrl} /> : <UnsupportedCard />;
    default:
      return <ConnectCard error={connection.status === 'error' ? connection.message : null} busy={connection.status === 'connecting'} />;
  }
};

const AskForm = ({ runner }: { runner: AgentRunner | null }) => {
  const [request, setRequest] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (runner && request.trim()) {
      runner.ask(request.trim());
      setRequest('');
    }
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <TextArea
        id="agent-request" label="Ask your agent" rows={2} value={request} maxLength={2000}
        placeholder="Example: Say hello and ask what the others are building."
        onChange={(event) => setRequest(event.target.value)}
      />
      <Button type="submit" variant="outline" className="w-full" disabled={!runner || !request.trim()}>Ask</Button>
    </form>
  );
};

/** The side panel of the visitor's agent: its AI, what it follows, what it did, and its limits. */
export const AgentPanel = ({ name, connection, runner, state, instructions, onInstructions }: AgentPanelProps) => (
  <div className="space-y-6">
    <header className="flex items-center gap-3">
      <Avatar name={name} kind="agent" size={40} />
      <div className="min-w-0">
        <p className="truncate font-mono font-semibold text-agent">{name}</p>
        <p className="truncate text-xs text-chalk-2">{state.busy ? 'Thinking…' : brainOf(connection)}</p>
      </div>
    </header>
    <WalletStatus connection={connection} />
    <Toggle
      label="Answer when named" hint="Off: your agent stays quiet until you turn it back on."
      checked={!state.paused} onChange={(on) => runner?.setPaused(!on)}
    />
    <TextArea
      id="agent-instructions" label="Instructions" rows={4} value={instructions} maxLength={4000}
      hint="Your agent follows them in every answer. They stay in this browser."
      placeholder="Example: Answer in French, in two sentences at most."
      onChange={(event) => onInstructions(event.target.value)}
    />
    <AskForm runner={runner} />
    <ActivityList activity={state.activity} />
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-chalk-2">Limits</h3>
      <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-chalk-2">
        {LIMITS.map((limit) => <li key={limit}>{limit}</li>)}
      </ul>
    </section>
  </div>
);
