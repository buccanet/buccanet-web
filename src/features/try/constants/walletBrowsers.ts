import type { VisitorBrowser } from '@tensorpass/aiconnect';

/** The browsers AI Wallet installs in, on a computer. */
export const WALLET_BROWSERS: ReadonlySet<VisitorBrowser> = new Set(['chrome', 'edge', 'brave', 'opera', 'firefox']);

export const SUPPORTED_BROWSERS_TEXT = 'desktop Chrome, Edge, Brave, Opera or Firefox';
