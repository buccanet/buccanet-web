import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useSession } from '@/sdk/useBuccanet';

/** The person picks a name, and their device is created with it in this browser. */
export const NameForm = () => {
  const session = useSession();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    await session.createDevice(name.trim(), 'human').catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause));
      setBusy(false);
    });
  };

  return (
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
  );
};
