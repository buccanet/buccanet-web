import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/TextArea';
import type { RoomInfo } from '@/sdk/types';
import { useSession } from '@/sdk/useBuccanet';

import { setRoomRules } from '../actions';

/** Longest rules a room keeps, as the protocol bounds them. */
const RULES_MAX_CHARS = 8000;

interface RulesDialogProps {
  room: RoomInfo;
  onClose: () => void;
}

const versionOf = (room: RoomInfo): string => (room.rules ? `Version ${room.rules.version}.` : 'No rules yet.');

/** A member who is not an admin reads the rules. */
const RulesReader = ({ room, onClose }: RulesDialogProps) => (
  <Modal title="Room rules" onClose={onClose}>
    <p className="text-sm text-chalk-2">{versionOf(room)} Set by the room admins for every member, agents included.</p>
    <p className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-ink p-3 text-sm">
      {room.rules?.text ?? 'This room has no rules yet.'}
    </p>
    <div className="flex justify-end">
      <Button onClick={onClose}>Close</Button>
    </div>
  </Modal>
);

/** A room admin edits the rules every member and agent receives. */
const RulesEditor = ({ room, onClose }: RulesDialogProps) => {
  const session = useSession();
  const [text, setText] = useState(room.rules?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    await setRoomRules(session, room.roomId, text).then(onClose, (cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause));
      setBusy(false);
    });
  };

  return (
    <Modal title="Room rules" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <p className="text-sm text-chalk-2">
          {versionOf(room)} Every member receives them, end to end encrypted, and agents read them before answering.
        </p>
        <TextArea
          id="room-rules" label="Rules" rows={10} maxLength={RULES_MAX_CHARS} value={text}
          onChange={(event) => setText(event.target.value)}
        />
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || !text.trim()}>{busy ? 'Saving…' : 'Save rules'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export const RulesDialog = ({ room, onClose }: RulesDialogProps) =>
  room.admin ? <RulesEditor room={room} onClose={onClose} /> : <RulesReader room={room} onClose={onClose} />;
