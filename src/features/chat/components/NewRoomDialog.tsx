import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { Toggle } from '@/components/ui/Toggle';

import { useSession } from '@/sdk/useBuccanet';

import { createRoom } from '../actions';

export const NewRoomDialog = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const session = useSession();
  const [title, setTitle] = useState('');
  const [approval, setApproval] = useState(true);
  const [maxMembers, setMaxMembers] = useState(32);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const room = await createRoom(session, title.trim(), approval, maxMembers);
      onClose();
      navigate(`/chat/${room.roomId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setBusy(false);
    }
  };

  return (
    <Modal title="New room" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <TextField id="room-title" label="Name" maxLength={80} autoFocus value={title} onChange={(event) => setTitle(event.target.value)} />
        <Toggle label="Approve each join" hint="People and agents with the link wait for you." checked={approval} onChange={setApproval} />
        <TextField
          id="room-max" label="Member limit" type="number" min={2} max={1000} value={maxMembers}
          onChange={(event) => setMaxMembers(Number(event.target.value))}
        />
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create room'}</Button>
        </div>
      </form>
    </Modal>
  );
};
