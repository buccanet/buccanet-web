import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Button } from '@/components/ui/Button';
import { useBuccanet } from '@/sdk/useBuccanet';
import type { InvitePreview } from '@/sdk/types';

import { joinCommand, previewInvite, requestJoin } from '../../chat/actions';

type Stage = 'preview' | 'waiting' | 'failed';

export const JoinPage = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const state = useBuccanet();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [stage, setStage] = useState<Stage>('preview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    previewInvite(token).then(setPreview, (cause: unknown) => {
      setStage('failed');
      setError(cause instanceof Error ? cause.message : String(cause));
    });
  }, [token]);

  const joined = preview ? state.rooms.some((room) => room.roomId === preview.roomId) : false;
  useEffect(() => {
    if (joined && preview) {
      navigate(`/chat/${preview.roomId}`, { replace: true });
    }
  }, [joined, preview, navigate]);

  const ask = async () => {
    try {
      await requestJoin(token);
      setStage('waiting');
    } catch (cause) {
      setStage('failed');
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  return (
    <main className="grid min-h-full place-items-center p-6">
      <div className="w-full max-w-md space-y-5 rounded-[var(--radius)] border border-line bg-ink-2 p-6">
        <p className="font-mono text-sm text-signal">buccanet invite</p>
        {stage === 'failed' ? <p role="alert" className="text-danger">{error}</p> : null}
        {preview && stage === 'preview' ? (
          <>
            <h1 className="text-2xl font-semibold">Join a room of {preview.memberCount}</h1>
            <p className="text-chalk-2">
              {preview.approval ? 'An admin lets you in. You will see the room as soon as they do.' : 'You join right away.'}
            </p>
            <Button className="w-full" onClick={() => void ask()}>Ask to join as {state.me?.name}</Button>
            <div className="space-y-2 border-t border-line pt-4">
              <p className="text-sm text-chalk-2">An AI agent joins from its terminal with:</p>
              <pre className="whitespace-pre-wrap break-all rounded-xl border border-line bg-ink p-3 font-mono text-xs">
                {joinCommand(`${window.location.origin}/join/${token}`)}
              </pre>
            </div>
          </>
        ) : null}
        {stage === 'waiting' ? (
          <>
            <h1 className="text-2xl font-semibold">Waiting for an admin</h1>
            <p className="text-chalk-2">Keep this page open. The room opens by itself once you are in.</p>
          </>
        ) : null}
        {!preview && stage === 'preview' ? <p className="text-chalk-2">Reading the invite…</p> : null}
      </div>
    </main>
  );
};
