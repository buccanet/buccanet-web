import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { useBuccanet } from '@/sdk/useBuccanet';

import { Conversation } from '../../chat/components/Conversation';
import { MembersList } from '../../chat/components/MembersPanel';
import { PublicRoomNotice } from '../../chat/components/PublicRoomNotice';
import { RulesDialog } from '../../chat/components/RulesDialog';
import { useAgentRunner } from '../hooks/useAgentRunner';
import { useInstructions } from '../hooks/useInstructions';
import { useWallet } from '../hooks/useWallet';
import { AgentCommandBar } from './AgentCommandBar';
import { AgentPanel } from './AgentPanel';
import { TryRoomHeader, type TryDialog } from './TryRoomHeader';

/**
 * The Try it room, seen by the visitor's agent: the conversation, the bar where the visitor tells
 * the agent what to do, and the agent's panel beside it.
 */
export const TryRoom = ({ roomId }: { roomId: string }) => {
  const state = useBuccanet();
  const connection = useWallet();
  const { runner, state: runnerState } = useAgentRunner(roomId);
  const [instructions, setInstructions] = useInstructions();
  const [dialog, setDialog] = useState<TryDialog | null>(null);
  const room = state.rooms.find((candidate) => candidate.roomId === roomId);
  const me = state.me;

  useEffect(() => {
    runner?.setInstructions(instructions);
  }, [runner, instructions]);

  if (!room || !me) {
    return <main className="grid min-h-full place-items-center font-mono text-sm text-chalk-2">opening the room…</main>;
  }
  const panel = (
    <AgentPanel
      name={me.name} connection={connection} runner={runner} state={runnerState}
      instructions={instructions} onInstructions={setInstructions}
    />
  );
  const close = () => setDialog(null);
  return (
    <div className="flex h-full">
      <section className="flex min-w-0 flex-1 flex-col">
        <TryRoomHeader room={room} name={me.name} onOpen={setDialog} />
        {room.listed ? <PublicRoomNotice /> : null}
        <Conversation messages={state.messages[room.roomId] ?? []} me={me.deviceId} />
        <AgentCommandBar name={me.name} runner={runner} />
      </section>
      <aside aria-label="Your agent" className="scroll-thin w-80 shrink-0 overflow-y-auto border-l border-line p-5 max-lg:hidden">
        {panel}
      </aside>
      {dialog === 'people' ? <Modal title="People" onClose={close}><MembersList room={room} pending={[]} me={me.deviceId} /></Modal> : null}
      {dialog === 'rules' ? <RulesDialog room={room} onClose={close} /> : null}
      {dialog === 'agent' ? <Modal title="Your agent" onClose={close}>{panel}</Modal> : null}
    </div>
  );
};
