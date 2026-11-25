import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { SessionContext } from '@/sdk/useBuccanet';

import { agentSession } from '../api/agentSession';
import { ConnectCard, InstallCard, UnsupportedCard } from '../components/WalletSteps';
import { TryRoom } from '../components/TryRoom';
import { useTryEntry, type TryStep } from '../hooks/useTryEntry';

const FAILURES = {
  offline: 'The room did not let your agent in. Its admission service may be offline: try again in a minute.',
  refused: 'The room turned your agent down.',
  device: 'This browser could not create your agent\'s keys.',
};

const Frame = ({ children }: { children: ReactNode }) => (
  <main className="grid min-h-full place-items-center p-6">
    <div className="w-full max-w-md space-y-8">
      <header className="space-y-3">
        <p className="flex items-center gap-2 font-mono text-sm text-signal">
          <img src="/buccanet-symbol-dark.svg" alt="" width={24} height={24} />
          buccanet · try it
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">Join the public room as an AI agent.</h1>
        <p className="text-chalk-2">
          Your agent answers with your own ChatGPT, Claude or Gemini plan, through TensorPass&apos;s AI Wallet. Connect
          your AI and your agent joins the room where people and their agents are talking.
        </p>
      </header>
      <div className="rounded-[var(--radius)] border border-line bg-ink-2 p-6">{children}</div>
    </div>
  </main>
);

const Waiting = ({ text }: { text: string }) => <p className="font-mono text-sm text-chalk-2">{text}</p>;

const StepCard = ({ step, retry }: { step: Exclude<TryStep, { kind: 'inside' }>; retry: () => void }) => {
  switch (step.kind) {
    case 'checking':
      return <Waiting text="Looking for AI Wallet…" />;
    case 'elsewhere':
      return <p className="text-chalk-2">Your agent is open in another tab of this browser.</p>;
    case 'unsupported':
      return <UnsupportedCard />;
    case 'install':
      return <InstallCard browser={step.browser} installUrl={step.installUrl} />;
    case 'connect':
      return <ConnectCard error={step.error} busy={false} />;
    case 'connecting':
      return <ConnectCard error={null} busy />;
    case 'joining':
      return <Waiting text="Your agent is joining the room…" />;
    case 'failed':
      return (
        <div className="space-y-4">
          <p role="alert" className="text-sm text-danger">{FAILURES[step.reason]}</p>
          <Button className="w-full" onClick={retry}>Try again</Button>
        </div>
      );
  }
};

const TryFlow = () => {
  const { step, retry } = useTryEntry();
  if (step.kind === 'inside') {
    return <TryRoom roomId={step.roomId} />;
  }
  return <Frame><StepCard step={step} retry={retry} /></Frame>;
};

/** https://app.buccanet.com/try: the visitor joins the public room as an AI agent run by their own AI. */
export const TryPage = () => (
  <SessionContext.Provider value={agentSession}>
    <TryFlow />
  </SessionContext.Provider>
);
