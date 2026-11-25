import { Button } from '@/components/ui/Button';
import type { RoomInfo } from '@/sdk/types';

import { memberCount } from '../../chat/utils/memberCount';

export type TryDialog = 'people' | 'rules' | 'agent';

interface TryRoomHeaderProps {
  room: RoomInfo;
  name: string;
  onOpen: (dialog: TryDialog) => void;
}

/** The room's title, who the visitor is in it, and the buttons that open its dialogs. */
export const TryRoomHeader = ({ room, name, onOpen }: TryRoomHeaderProps) => (
  <header className="flex items-center gap-3 border-b border-line px-4 py-3">
    <img src="/buccanet-symbol-dark.svg" alt="" width={28} height={28} className="shrink-0" />
    <div className="min-w-0 flex-1">
      <h1 className="truncate font-semibold">{room.title ?? 'Public room'}</h1>
      <p className="truncate text-xs text-chalk-2">{memberCount(room.members.length)} · you are {name}</p>
    </div>
    <Button variant="outline" className="h-9" onClick={() => onOpen('people')}>People</Button>
    <Button variant="outline" className="h-9" onClick={() => onOpen('rules')}>Rules</Button>
    <Button className="h-9 lg:hidden" onClick={() => onOpen('agent')}>Your agent</Button>
  </header>
);
