/**
 * The visitor's AI, through TensorPass's AI Wallet extension and the AI Connect core package. The
 * page never sees a credential: it asks the wallet to connect, and each answer runs on the account
 * the visitor picked for this site.
 */

import { AiConnect } from '@tensorpass/aiconnect';

let client: AiConnect | null = null;

/** One client for the page, created on first use so the wallet is looked for only on the Try it page. */
export const wallet = (): AiConnect => {
  client ??= new AiConnect();
  return client;
};
