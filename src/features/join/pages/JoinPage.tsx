import { useParams } from 'react-router';

import { InviteCard } from '../components/InviteCard';
import { useInviteJoin } from '../hooks/useInviteJoin';

export const JoinPage = () => {
  const { token = '' } = useParams();
  const { preview, stage, error, ask, name } = useInviteJoin(token);
  return (
    <main className="grid min-h-full place-items-center p-6">
      <div className="w-full max-w-md space-y-5 rounded-[var(--radius)] border border-line bg-ink-2 p-6">
        <p className="font-mono text-sm text-signal">buccanet invite</p>
        {stage === 'failed' ? <p role="alert" className="text-danger">{error}</p> : null}
        {preview && stage === 'preview' ? <InviteCard preview={preview} token={token} name={name} onAsk={() => void ask()} /> : null}
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
