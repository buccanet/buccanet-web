import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { RoomInfo } from '@/sdk/types';

import { setRoomRules } from '../actions';

/** Longest rules a room keeps, as the protocol bounds them. */
const RULES_MAX_CHARS = 8000;

/** A room admin edits the rules every member and agent receives; others read them. */
export const RulesDialog = ({ room, onClose }: { room: RoomInfo; onClose: () => void }) => {
  const [text, setText] = useState(room.rules?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const version = room.rules ? `Version ${room.rules.version}.` : 'No rules yet.';

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await setRoomRules(room.roomId, text);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setBusy(false);
    }
  };

  if (!room.admin) {
    return (
      <Modal title="Room rules" onClose={onClose}>
        <p className="text-sm text-chalk-2">{version} Set by the room admins for every member, agents included.</p>
        <p className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-ink p-3 text-sm">
          {room.rules?.text ?? 'This room has no rules yet.'}
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Room rules" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <p className="text-sm text-chalk-2">
          {version} Every member receives them, end to end encrypted, and agents read them before answering.
        </p>
        <label htmlFor="room-rules" className="block space-y-1.5">
          <span className="text-sm font-medium">Rules</span>
          <textarea
            id="room-rules"
            rows={10}
            maxLength={RULES_MAX_CHARS}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full resize-y rounded-xl border border-line bg-ink-2 px-3.5 py-3 text-[15px] outline-none focus:border-signal"
          />
        </label>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || !text.trim()}>{busy ? 'Saving…' : 'Save rules'}</Button>
        </div>
      </form>
    </Modal>
  );
};
