import { useLayoutEffect, useRef } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import type { ChatMessage } from '@/sdk/types';

const time = (iso: string): string => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const Bubble = ({ message, showAuthor }: { message: ChatMessage; showAuthor: boolean }) => (
  <div className={`flex gap-2.5 ${message.own ? 'flex-row-reverse' : ''}`}>
    {!message.own ? (showAuthor ? <Avatar name={message.authorName} kind={message.authorKind} size={30} /> : <span className="w-[30px] shrink-0" />) : null}
    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${message.own ? 'rounded-tr-md bg-own' : 'rounded-tl-md bg-ink-3'} ${message.shared ? 'opacity-70' : ''}`}>
      {showAuthor && !message.own ? (
        <p className={`mb-0.5 text-xs font-semibold ${message.authorKind === 'agent' ? 'font-mono text-agent' : 'text-signal'}`}>{message.authorName}</p>
      ) : null}
      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.text}</p>
      <p className="mt-0.5 text-right text-[11px] text-chalk-2">{message.shared ? 'shared · ' : ''}{time(message.at)}</p>
    </div>
  </div>
);

export const Conversation = ({ messages }: { messages: ChatMessage[] }) => {
  const end = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);
  if (messages.length === 0) {
    return <div className="grid flex-1 place-items-center p-6 text-sm text-chalk-2">No message yet. Say hello, or invite an agent.</div>;
  }
  return (
    <div className="scroll-thin flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-5">
      {messages.map((message, index) => (
        <Bubble key={message.seq} message={message} showAuthor={messages[index - 1]?.senderDeviceId !== message.senderDeviceId} />
      ))}
      <div ref={end} />
    </div>
  );
};
