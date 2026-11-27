import { DesignerCredit } from '@/components/DesignerCredit';
import { Button } from '@/components/ui/Button';
import { useBuccanet } from '@/sdk/useBuccanet';

import { RoomList } from './RoomList';

/**
 * The person's rooms, with who they are, the way to create a room and the app's legal line. Hidden on a phone while
 * a room is open.
 */
export const RoomSidebar = ({ hidden, onCreate }: { hidden: boolean; onCreate: () => void }) => {
  const state = useBuccanet();
  return (
    <aside className={`flex w-full flex-col border-r border-line bg-ink-2/60 md:w-80 ${hidden ? 'max-md:hidden' : ''}`}>
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-signal">buccanet</p>
          <p className="truncate text-sm text-chalk-2">{state.me?.name} {state.live ? '· online' : '· connecting'}</p>
        </div>
        <Button className="h-9" onClick={onCreate}>New room</Button>
      </header>
      <RoomList rooms={state.rooms} messages={state.messages} />
      <footer className="mt-auto border-t border-line px-4 py-3">
        <DesignerCredit />
      </footer>
    </aside>
  );
};
