import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { ChatPage } from '@/features/chat/pages/ChatPage';
import { JoinPage } from '@/features/join/pages/JoinPage';
import { WelcomePage } from '@/features/onboarding/pages/WelcomePage';
import { TryPage } from '@/features/try/pages/TryPage';
import { personSession } from '@/sdk/session';
import { useBuccanet } from '@/sdk/useBuccanet';

const Gate = () => {
  const state = useBuccanet();
  useEffect(() => {
    void personSession.boot();
  }, []);
  if (state.status === 'loading') {
    return <main className="grid min-h-full place-items-center font-mono text-sm text-chalk-2">opening your device…</main>;
  }
  if (state.status === 'elsewhere') {
    return <main className="grid min-h-full place-items-center p-6 text-center text-chalk-2">Buccanet is open in another tab of this browser.</main>;
  }
  if (state.status === 'failed') {
    return <main className="grid min-h-full place-items-center p-6 text-center text-danger">This device could not be opened.</main>;
  }
  return (
    <Routes>
      <Route path="/join/:token" element={state.status === 'needs-device' ? <WelcomePage reason="Pick a name to join this room. Your keys are created in this browser." /> : <JoinPage />} />
      <Route path="*" element={state.status === 'needs-device' ? <WelcomePage /> : <Chats />} />
    </Routes>
  );
};

const Chats = () => (
  <Routes>
    <Route path="/" element={<ChatPage />} />
    <Route path="/chat/:roomId" element={<ChatPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

/** The Try it room runs the visitor's agent device; every other page runs the person's own device. */
export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/try" element={<TryPage />} />
      <Route path="*" element={<Gate />} />
    </Routes>
  </BrowserRouter>
);
