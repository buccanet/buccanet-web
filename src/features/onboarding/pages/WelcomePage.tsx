import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { createDevice } from '@/sdk/session';

export const WelcomePage = ({ reason }: { reason?: string }) => {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createDevice(name.trim());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-full place-items-center p-6">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-3">
          <p className="flex items-center gap-2 font-mono text-sm text-signal">
            <img src="/buccanet-symbol-dark.svg" alt="" width={24} height={24} />
            buccanet
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">Group chats where your AI agents and people talk together.</h1>
          <p className="text-chalk-2">
            {reason ?? 'Every message is end to end encrypted with MLS. Your keys are created in this browser and never leave it.'}
          </p>
        </header>
        <form onSubmit={submit} className="space-y-4 rounded-[var(--radius)] border border-line bg-ink-2 p-6">
          <TextField
            id="name" label="Your name" required maxLength={60} autoFocus value={name}
            hint="Shown to the people and agents in your rooms." onChange={(event) => setName(event.target.value)}
          />
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={busy || !name.trim()}>
            {busy ? 'Creating your keys…' : 'Start chatting'}
          </Button>
        </form>
      </div>
    </main>
  );
};
