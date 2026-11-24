import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/Button';
import type { MemberInfo } from '@/sdk/types';

import { sendText } from '../actions';
import { insertMention, mentionCandidates, mentionQuery } from '../utils/mentionQuery';

interface ComposerProps {
  roomId: string;
  members: MemberInfo[];
  me: string;
}

/** Enter sends, Shift Enter adds a line, and `@` offers the members to name. */
export const Composer = ({ roomId, members, me }: ComposerProps) => {
  const [text, setText] = useState('');
  const [caret, setCaret] = useState(0);
  const [picked, setPicked] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const query = mentionQuery(text, caret);
  const candidates = query ? mentionCandidates(query, members, me) : [];

  const send = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = text.trim();
    if (!value) {
      return;
    }
    setText('');
    setError(null);
    try {
      await sendText(roomId, value);
    } catch (cause) {
      setText(value);
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const mention = (member: MemberInfo) => {
    if (!query) {
      return;
    }
    const next = insertMention(text, caret, query, member);
    setText(next.text);
    setCaret(next.caret);
    setPicked(0);
    requestAnimationFrame(() => field.current?.setSelectionRange(next.caret, next.caret));
    field.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (candidates.length > 0 && ['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(event.key)) {
      event.preventDefault();
      const step = event.key === 'ArrowUp' ? -1 : 1;
      if (event.key.startsWith('Arrow')) {
        setPicked((picked + step + candidates.length) % candidates.length);
      } else {
        const chosen = candidates[Math.min(picked, candidates.length - 1)];
        if (chosen) {
          mention(chosen);
        }
      }
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <form onSubmit={send} className="relative border-t border-line p-3">
      {candidates.length > 0 ? (
        <ul role="listbox" aria-label="Members to name" className="absolute bottom-full left-3 mb-1 w-64 overflow-hidden rounded-xl border border-line bg-ink-2 py-1">
          {candidates.map((member, index) => (
            <li key={member.deviceId} role="option" aria-selected={index === picked}>
              <button
                type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => mention(member)}
                className={`w-full truncate px-3 py-1.5 text-left text-sm ${index === picked ? 'bg-ink-3 text-chalk' : 'text-chalk-2'}`}
              >
                @{member.name}
                <span className="text-xs text-chalk-2"> · {member.kind === 'agent' ? 'agent' : 'person'}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p role="alert" className="px-1 pb-2 text-sm text-danger">{error}</p> : null}
      <div className="flex items-end gap-2">
        <textarea
          ref={field} aria-label="Message" rows={1} value={text} placeholder="Message the room · @ to name someone"
          className="scroll-thin max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-[15px] outline-none focus:border-signal"
          onChange={(event) => {
            setText(event.target.value);
            setCaret(event.target.selectionStart);
            setPicked(0);
          }}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
        />
        <Button type="submit" disabled={!text.trim()} aria-label="Send">Send</Button>
      </div>
    </form>
  );
};
