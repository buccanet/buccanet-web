import { TensorPassMark } from './TensorPassMark';

const CREDIT_URL = 'https://tensorpass.app/?utm_source=buccanet&utm_medium=referral&utm_campaign=ai_credit';

/** The line under the agent's question box: the TensorPass mark and a link that names Buccanet as its source. */
export const TensorPassCredit = () => (
  <a
    className="inline-flex items-center gap-[6px] text-inherit hover:underline"
    href={CREDIT_URL} target="_blank" rel="noopener"
  >
    <TensorPassMark className="size-[14px] shrink-0" />
    AI features powered by TensorPass
  </a>
);
