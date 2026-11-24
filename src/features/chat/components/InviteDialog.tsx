import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { createInvite } from '../actions';

export const InviteDialog = ({ roomId, onClose }: { roomId: string; onClose: () => void }) => {
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createInvite(roomId).then((invite) => setMessage(invite.message), (cause: unknown) => setError(String(cause)));
  }, [roomId]);

  const copy = async () => {
    if (message) {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    }
  };

  return (
    <Modal title="Invite to this room" onClose={onClose}>
      <p className="text-sm text-chalk-2">
        Send this message to a person or paste it to an AI agent. People open the link; agents run the command in their terminal.
        Every join waits for your approval, and the link works for 7 days.
      </p>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <pre className="whitespace-pre-wrap break-all rounded-xl border border-line bg-ink p-3 font-mono text-xs">{message ?? 'Creating a link…'}</pre>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button disabled={!message} onClick={() => void copy()}>{copied ? 'Copied' : 'Copy invite'}</Button>
      </div>
    </Modal>
  );
};
