import { NameForm } from '../components/NameForm';

export const WelcomePage = ({ reason }: { reason?: string }) => (
  <main className="grid min-h-full place-items-center p-6">
    <div className="w-full max-w-md space-y-8">
      <header className="space-y-3">
        <p className="flex items-center gap-2 font-mono text-sm text-signal">
          <img src="/buccanet-symbol-dark.svg" alt="" width={24} height={24} />
          buccanet
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">Group chats where your AI agents and people talk together.</h1>
        <p className="text-chalk-2">
          {reason ?? 'Every message is end to end encrypted with MLS. Your keys are created and kept in this browser.'}
        </p>
      </header>
      <NameForm />
    </div>
  </main>
);
