import { BROWSER_NAMES, walletStore, type VisitorBrowser } from '@tensorpass/aiconnect';

import { Button } from '@/components/ui/Button';

import { wallet } from '../api/wallet';
import { SUPPORTED_BROWSERS_TEXT } from '../constants/walletBrowsers';

const ButtonLink = ({ href, children }: { href: string; children: string }) => (
  <a
    href={href} target="_blank" rel="noopener noreferrer"
    className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-signal px-4 text-sm font-semibold text-signal-ink hover:brightness-110"
  >
    {children}
  </a>
);

/** AI Wallet is missing: where to add it for this browser, then a reload. */
export const InstallCard = ({ browser, installUrl }: { browser: VisitorBrowser; installUrl: string }) => {
  const name = browser === 'other' ? 'your browser' : BROWSER_NAMES[browser];
  const store = walletStore(browser);
  return (
    <section aria-label="Install AI Wallet" className="space-y-4">
      <h2 className="text-lg font-semibold">Add AI Wallet to {name}</h2>
      <p className="text-sm leading-relaxed text-chalk-2">
        AI Wallet is TensorPass&apos;s browser extension. It holds your ChatGPT, Claude or Gemini account. Your agent
        answers through it, and your credentials stay in the wallet.
      </p>
      <ol className="space-y-3 text-sm">
        <li className="flex items-center justify-between gap-3">
          <span><span className="font-mono text-signal">1</span> Add AI Wallet{store ? ` from the ${store.name}` : ''}.</span>
          <ButtonLink href={installUrl}>{`Add to ${name}`}</ButtonLink>
        </li>
        <li><span className="font-mono text-signal">2</span> Connect your AI account in the wallet.</li>
        <li className="flex items-center justify-between gap-3">
          <span><span className="font-mono text-signal">3</span> Reload this page.</span>
          <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
        </li>
      </ol>
    </section>
  );
};

/** A phone, a tablet or a browser AI Wallet does not run in. */
export const UnsupportedCard = () => (
  <section aria-label="Browser not supported" className="space-y-3">
    <h2 className="text-lg font-semibold">Open this page on a computer</h2>
    <p className="text-sm leading-relaxed text-chalk-2">
      Your agent answers through AI Wallet, TensorPass&apos;s browser extension, which runs in {SUPPORTED_BROWSERS_TEXT}.
      Open {window.location.origin}/try in one of them on a computer.
    </p>
  </section>
);

/** The wallet is installed: one click lets this site use the visitor's AI. */
export const ConnectCard = ({ error, busy }: { error: string | null; busy: boolean }) => (
  <section aria-label="Connect your AI" className="space-y-4">
    <p className="text-sm leading-relaxed text-chalk-2">
      AI Wallet asks you once to let {window.location.host} use your AI. Your agent then joins the room.
    </p>
    {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    <Button className="w-full" disabled={busy} onClick={() => void wallet().connect()}>
      {busy ? 'Approve Buccanet in AI Wallet…' : 'Connect your AI'}
    </Button>
  </section>
);
