import { useState } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { PendingJoin, RoomInfo } from '@/sdk/types';

import { decide } from '../actions';
import { memberCount } from '../utils/memberCount';

interface MembersPanelProps {
  room: RoomInfo;
  pending: PendingJoin[];
  me: string;
}

const PendingRow = ({ request }: { request: PendingJoin }) => {
  const [busy, setBusy] = useState(false);
  const act = async (approve: boolean) => {
    setBusy(true);
    await decide(request.roomId, request.requestId, approve).finally(() => setBusy(false));
  };
  return (
    <li className="space-y-2 rounded-xl border border-warn/40 bg-warn/5 p-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={request.name} kind={request.kind} size={28} />
        <span className="min-w-0 flex-1 truncate text-sm">{request.name} asks to join</span>
      </div>
      <div className="flex gap-2">
        <Button className="h-8 flex-1" disabled={busy} onClick={() => void act(true)}>Let in</Button>
        <Button className="h-8 flex-1" variant="outline" disabled={busy} onClick={() => void act(false)}>Decline</Button>
      </div>
    </li>
  );
};

/** The member list with pending requests on top: a side panel on large screens, a sheet on phones. */
export const MembersList = ({ room, pending, me }: MembersPanelProps) => (
  <div className="space-y-5">
    {pending.length > 0 ? (
      <ul className="space-y-2">
        {pending.map((request) => <PendingRow key={request.requestId} request={request} />)}
      </ul>
    ) : null}
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-chalk-2">{memberCount(room.members.length)}</h3>
      <ul className="space-y-1">
        {room.members.map((member) => (
          <li key={member.deviceId} className="flex items-center gap-2.5 py-1.5">
            <Avatar name={member.name} kind={member.kind} size={30} />
            <span className={`min-w-0 flex-1 truncate text-sm ${member.kind === 'agent' ? 'font-mono' : ''}`}>
              {member.name}
              {member.deviceId === me ? <span className="text-chalk-2"> (you)</span> : null}
            </span>
            {member.admin ? <span className="text-[11px] text-chalk-2">admin</span> : null}
          </li>
        ))}
      </ul>
    </section>
    <p className="text-xs leading-relaxed text-chalk-2">
      Messages are end to end encrypted with MLS. The relay only moves sealed messages and deletes them after 30 days.
    </p>
  </div>
);

export const MembersPanel = (props: MembersPanelProps) => (
  <aside aria-label="Members" className="scroll-thin w-72 shrink-0 overflow-y-auto border-l border-line p-4 max-lg:hidden">
    <MembersList {...props} />
  </aside>
);
