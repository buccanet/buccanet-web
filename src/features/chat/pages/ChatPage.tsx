import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { dismissNotice, refreshMessages } from '@/sdk/session';
import { useBuccanet } from '@/sdk/useBuccanet';

import { Composer } from '../components/Composer';
import { Conversation } from '../components/Conversation';
import { InviteDialog } from '../components/InviteDialog';
import { MembersList, MembersPanel } from '../components/MembersPanel';
import { NewRoomDialog } from '../components/NewRoomDialog';
import { RoomList } from '../components/RoomList';
import { RulesDialog } from '../components/RulesDialog';

export const ChatPage = () => {
  const { roomId } = useParams();
  const state = useBuccanet();
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [people, setPeople] = useState(false);
  const [reading, setReading] = useState(false);
  const room = state.rooms.find((candidate) => candidate.roomId === roomId);
  const pendingHere = state.pending.filter((request) => request.roomId === roomId);

  useEffect(() => {
    if (roomId) {
      void refreshMessages(roomId);
    }
  }, [roomId]);

  return (
    <div className="flex h-full">
      <aside className={`flex w-full flex-col border-r border-line bg-ink-2/60 md:w-80 ${roomId ? 'max-md:hidden' : ''}`}>
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-signal">buccanet</p>
            <p className="truncate text-sm text-chalk-2">{state.me?.name} {state.live ? '· online' : '· connecting'}</p>
          </div>
          <Button className="h-9" onClick={() => setCreating(true)}>New room</Button>
        </header>
        <RoomList rooms={state.rooms} messages={state.messages} />
      </aside>
      {room ? (
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Link to="/" className="text-chalk-2 md:hidden" aria-label="Back to rooms">‹</Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-semibold">{room.title ?? 'Untitled room'}</h1>
              <p className="truncate text-xs text-chalk-2">{room.members.map((member) => member.name).join(', ')}</p>
            </div>
            <Button variant="outline" className="h-9 lg:hidden" onClick={() => setPeople(true)}>
              People{pendingHere.length > 0 ? ` · ${pendingHere.length}` : ''}
            </Button>
            <Button variant="outline" className="h-9" onClick={() => setReading(true)}>Rules</Button>
            <Button variant="outline" className="h-9" onClick={() => setInviting(true)}>Invite</Button>
          </header>
          {state.notice ? (
            <button type="button" onClick={dismissNotice} className="border-b border-line bg-signal/10 px-4 py-2 text-left text-sm text-signal">
              {state.notice}
            </button>
          ) : null}
          <Conversation messages={state.messages[room.roomId] ?? []} />
          <Composer roomId={room.roomId} />
        </section>
      ) : (
        <section className="grid flex-1 place-items-center p-6 text-center text-chalk-2 max-md:hidden">
          <p>Pick a room, or create one and invite your agents.</p>
        </section>
      )}
      {room ? <MembersPanel room={room} pending={pendingHere} me={state.me?.deviceId ?? ''} /> : null}
      {people && room ? (
        <Modal title="People" onClose={() => setPeople(false)}>
          <MembersList room={room} pending={pendingHere} me={state.me?.deviceId ?? ''} />
        </Modal>
      ) : null}
      {creating ? <NewRoomDialog onClose={() => setCreating(false)} /> : null}
      {inviting && room ? <InviteDialog roomId={room.roomId} onClose={() => setInviting(false)} /> : null}
      {reading && room ? <RulesDialog room={room} onClose={() => setReading(false)} /> : null}
    </div>
  );
};
