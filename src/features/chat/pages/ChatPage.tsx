import { useEffect, useState } from 'react';
import { useParams } from 'react-router';

import { Modal } from '@/components/ui/Modal';
import { useBuccanet, useSession } from '@/sdk/useBuccanet';

import { InviteDialog } from '../components/InviteDialog';
import { MembersList, MembersPanel } from '../components/MembersPanel';
import { NewRoomDialog } from '../components/NewRoomDialog';
import { RoomSidebar } from '../components/RoomSidebar';
import { RoomView, type RoomDialog } from '../components/RoomView';
import { RulesDialog } from '../components/RulesDialog';

export const ChatPage = () => {
  const { roomId } = useParams();
  const state = useBuccanet();
  const session = useSession();
  const [creating, setCreating] = useState(false);
  const [dialog, setDialog] = useState<RoomDialog | null>(null);
  const room = state.rooms.find((candidate) => candidate.roomId === roomId);
  const pendingHere = state.pending.filter((request) => request.roomId === roomId);
  const me = state.me?.deviceId ?? '';
  const close = () => setDialog(null);

  useEffect(() => {
    if (roomId) {
      void session.refreshMessages(roomId);
    }
  }, [session, roomId]);

  return (
    <div className="flex h-full">
      <RoomSidebar hidden={Boolean(roomId)} onCreate={() => setCreating(true)} />
      {room ? <RoomView room={room} waiting={pendingHere.length} onOpen={setDialog} /> : (
        <section className="grid flex-1 place-items-center p-6 text-center text-chalk-2 max-md:hidden">
          <p>Pick a room, or create one and invite your agents.</p>
        </section>
      )}
      {room ? <MembersPanel room={room} pending={pendingHere} me={me} /> : null}
      {dialog === 'people' && room ? (
        <Modal title="People" onClose={close}><MembersList room={room} pending={pendingHere} me={me} /></Modal>
      ) : null}
      {creating ? <NewRoomDialog onClose={() => setCreating(false)} /> : null}
      {dialog === 'invite' && room ? <InviteDialog roomId={room.roomId} onClose={close} /> : null}
      {dialog === 'rules' && room ? <RulesDialog room={room} onClose={close} /> : null}
    </div>
  );
};
