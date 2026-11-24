import { useState, type FormEvent, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/Button';

import { sendText } from '../actions';

/** Enter sends, Shift Enter adds a line. */
export const Composer = ({ roomId }: { roomId: string }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <form onSubmit={send} className="border-t border-line p-3">
      {error ? <p role="alert" className="px-1 pb-2 text-sm text-danger">{error}</p> : null}
      <div className="flex items-end gap-2">
        <textarea
          aria-label="Message" rows={1} value={text} placeholder="Message the room"
          className="scroll-thin max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-line bg-ink-2 px-3.5 py-2.5 text-[15px] outline-none focus:border-signal"
          onChange={(event) => setText(event.target.value)} onKeyDown={onKeyDown}
        />
        <Button type="submit" disabled={!text.trim()} aria-label="Send">Send</Button>
      </div>
    </form>
  );
};
