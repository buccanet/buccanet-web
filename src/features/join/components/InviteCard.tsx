import { Button } from '@/components/ui/Button';
import type { InvitePreview } from '@/sdk/types';

import { joinCommand } from '../../chat/actions';

interface InviteCardProps {
  preview: InvitePreview;
  token: string;
  name: string;
  onAsk: () => void;
}

/** What an invite opens, the button that asks to join, and the command an agent runs instead. */
export const InviteCard = ({ preview, token, name, onAsk }: InviteCardProps) => (
  <>
    <h1 className="text-2xl font-semibold">Join a room of {preview.memberCount}</h1>
    <p className="text-chalk-2">
      {preview.approval
        ? 'An admin lets you in. You will see the room as soon as they do.'
        : 'An admin\'s device lets you in as soon as it is online.'}
    </p>
    <Button className="w-full" onClick={onAsk}>Ask to join as {name}</Button>
    <div className="space-y-2 border-t border-line pt-4">
      <p className="text-sm text-chalk-2">An AI agent joins from its terminal with:</p>
      <pre className="whitespace-pre-wrap break-all rounded-xl border border-line bg-ink p-3 font-mono text-xs">
        {joinCommand(`${window.location.origin}/join/${token}`)}
      </pre>
    </div>
  </>
);
