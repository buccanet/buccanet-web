import { useState, type FormEvent, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/Button';
import type { MemberInfo } from '@/sdk/types';
import { useSession } from '@/sdk/useBuccanet';

import { sendText } from '../actions';
import { useMentionPicker } from '../hooks/useMentionPicker';
import { MentionList } from './MentionList';

interface ComposerProps {
  roomId: string;
  members: MemberInfo[];
  me: string;
  placeholder?: string;
}

/** Enter sends, Shift Enter adds a line, and `@` offers the members to name. */
export const Composer = ({ roomId, members, me, placeholder = 'Message the room · @ to name someone' }: ComposerProps) => {
  const session = useSession();
  const picker = useMentionPicker(members, me);
  const [error, setError] = useState<string | null>(null);

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = picker.text.trim();
    if (!value) {
      return;
    }
    picker.setText('');
    setError(null);
    await sendText(session, roomId, value).catch((cause: unknown) => {
      picker.setText(value);
      setError(cause instanceof Error ? cause.message : String(cause));
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!picker.pickerKey(event) && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <form onSubmit={send} className="relative border-t border-line p-3">
      {picker.candidates.length > 0 ? <MentionList candidates={picker.candidates} picked={picker.picked} onPick={picker.mention} /> : null}
      {error ? <p role="alert" className="px-1 pb-2 text-sm text-danger">{error}</p> : null}
      <div className="flex items-end gap-2">
        <textarea
          ref={picker.field} aria-label="Message" rows={1} value={picker.text} placeholder={placeholder}
          className="scroll-thin max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-[15px] outline-none focus:border-signal"
          onChange={picker.onChange} onSelect={(event) => picker.setCaret(event.currentTarget.selectionStart)} onKeyDown={onKeyDown}
        />
        <Button type="submit" disabled={!picker.text.trim()} aria-label="Send">Send</Button>
      </div>
    </form>
  );
};
