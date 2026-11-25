import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import type { InvitePreview } from '@/sdk/types';
import { useBuccanet, useSession } from '@/sdk/useBuccanet';

import { previewInvite, requestJoin } from '../../chat/actions';

export type JoinStage = 'preview' | 'waiting' | 'failed';

const messageOf = (cause: unknown): string => (cause instanceof Error ? cause.message : String(cause));

/** Reads an invite, asks to join on request, and opens the room once the device is in it. */
export const useInviteJoin = (token: string) => {
  const navigate = useNavigate();
  const state = useBuccanet();
  const session = useSession();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [stage, setStage] = useState<JoinStage>('preview');
  const [error, setError] = useState<string | null>(null);
  const fail = (cause: unknown) => {
    setStage('failed');
    setError(messageOf(cause));
  };

  useEffect(() => {
    previewInvite(session, token).then(setPreview, (cause: unknown) => {
      setStage('failed');
      setError(messageOf(cause));
    });
  }, [session, token]);

  const joined = preview ? state.rooms.some((room) => room.roomId === preview.roomId) : false;
  useEffect(() => {
    if (joined && preview) {
      navigate(`/chat/${preview.roomId}`, { replace: true });
    }
  }, [joined, preview, navigate]);

  const ask = () => requestJoin(session, token).then(() => setStage('waiting'), fail);
  return { preview, stage, error, ask, name: state.me?.name ?? '' };
};
