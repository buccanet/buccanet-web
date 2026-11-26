import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { Button } from '@/components/ui/Button';
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
    return <OpenFailed failure={state.failure} />;
  }
  const welcome = state.status === 'needs-device';
  const forgotten = state.failure ?? undefined;
  return (
    <Routes>
      <Route path="/join/:token" element={welcome ? <WelcomePage reason={forgotten ?? JOIN_REASON} /> : <JoinPage />} />
      <Route path="*" element={welcome ? <WelcomePage reason={forgotten} /> : <Chats />} />
    </Routes>
  );
};

const JOIN_REASON = 'Pick a name to join this room. Your keys are created in this browser.';

/** The stored device did not open. It stays in this browser, and the person can try again. */
const OpenFailed = ({ failure }: { failure: string | null }) => (
  <main className="grid min-h-full place-items-center p-6">
    <div role="alert" className="max-w-md space-y-4 text-center">
      <p className="text-danger">This device could not be opened. Its keys stay in this browser.</p>
      {failure ? <p className="text-sm text-chalk-2">{failure}</p> : null}
      <Button onClick={() => void personSession.retry()}>Try again</Button>
    </div>
  </main>
);

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
