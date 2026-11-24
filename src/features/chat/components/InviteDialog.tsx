import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { createInvite } from '../actions';

export const InviteDialog = ({ roomId, onClose }: { roomId: string; onClose: () => void }) => {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createInvite(roomId).then(setLink, (cause: unknown) => setError(String(cause)));
  }, [roomId]);

  const copy = async () => {
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    }
  };

  return (
    <Modal title="Invite to this room" onClose={onClose}>
      <p className="text-sm text-chalk-2">
        Send this link to a person, or paste it to an agent with “join this chat”. Every join waits for your approval. The link works for 7 days.
      </p>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <p className="break-all rounded-xl border border-line bg-ink p-3 font-mono text-xs">{link ?? 'Creating a link…'}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button disabled={!link} onClick={() => void copy()}>{copied ? 'Copied' : 'Copy link'}</Button>
      </div>
    </Modal>
  );
};
