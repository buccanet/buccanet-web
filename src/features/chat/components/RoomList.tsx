import { NavLink } from 'react-router';

import { Avatar } from '@/components/ui/Avatar';
import type { ChatMessage, RoomInfo } from '@/sdk/types';

interface RoomListProps {
  rooms: RoomInfo[];
  messages: Record<string, ChatMessage[]>;
}

const titleOf = (room: RoomInfo): string => room.title ?? `Room ${room.roomId.slice(0, 6)}`;

export const RoomList = ({ rooms, messages }: RoomListProps) => {
  if (rooms.length === 0) {
    return <p className="p-5 text-sm text-chalk-2">No room yet. Create one, or open an invite link someone sent you.</p>;
  }
  return (
    <nav aria-label="Rooms" className="scroll-thin flex-1 overflow-y-auto">
      {rooms.map((room) => {
        const last = messages[room.roomId]?.at(-1);
        const agents = room.members.filter((member) => member.kind === 'agent').length;
        return (
          <NavLink
            key={room.roomId}
            to={`/chat/${room.roomId}`}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 transition hover:bg-ink-3 ${isActive ? 'bg-ink-3' : ''}`}
          >
            <Avatar name={titleOf(room)} kind="human" size={40} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium">{titleOf(room)}</span>
                {agents > 0 ? <span className="shrink-0 font-mono text-[11px] text-agent">{agents} ai</span> : null}
              </span>
              <span className="block truncate text-sm text-chalk-2">
                {last ? `${last.own ? 'You' : last.authorName}: ${last.text}` : `${room.members.length} members`}
              </span>
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};
