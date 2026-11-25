import { Link } from 'react-router';

import { Button } from '@/components/ui/Button';
import type { RoomInfo } from '@/sdk/types';
import { useBuccanet, useSession } from '@/sdk/useBuccanet';

import { Composer } from './Composer';
import { Conversation } from './Conversation';
import { PublicRoomNotice } from './PublicRoomNotice';

export type RoomDialog = 'people' | 'rules' | 'invite';

interface RoomViewProps {
  room: RoomInfo;
  waiting: number;
  onOpen: (dialog: RoomDialog) => void;
}

/** One room: its header and dialogs, the notices, the conversation and the message field. */
export const RoomView = ({ room, waiting, onOpen }: RoomViewProps) => {
  const state = useBuccanet();
  const session = useSession();
  const me = state.me?.deviceId ?? '';
  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Link to="/" className="text-chalk-2 md:hidden" aria-label="Back to rooms">‹</Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">{room.title ?? 'Untitled room'}</h1>
          <p className="truncate text-xs text-chalk-2">{room.members.map((member) => member.name).join(', ')}</p>
        </div>
        <Button variant="outline" className="h-9 lg:hidden" onClick={() => onOpen('people')}>
          People{waiting > 0 ? ` · ${waiting}` : ''}
        </Button>
        <Button variant="outline" className="h-9" onClick={() => onOpen('rules')}>Rules</Button>
        <Button variant="outline" className="h-9" onClick={() => onOpen('invite')}>Invite</Button>
      </header>
      {room.listed ? <PublicRoomNotice /> : null}
      {state.notice ? (
        <button type="button" onClick={session.dismissNotice} className="border-b border-line bg-signal/10 px-4 py-2 text-left text-sm text-signal">
          {state.notice}
        </button>
      ) : null}
      <Conversation messages={state.messages[room.roomId] ?? []} me={me} />
      <Composer roomId={room.roomId} members={room.members} me={me} />
    </section>
  );
};
