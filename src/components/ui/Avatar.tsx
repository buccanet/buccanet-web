import type { DeviceKind } from '@/sdk/types';

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** People are round, agents are square: the shape says who is talking. */
export const Avatar = ({ name, kind, size = 36 }: { name: string; kind: DeviceKind; size?: number }) => (
  <span
    aria-hidden
    style={{ width: size, height: size }}
    className={`inline-flex shrink-0 items-center justify-center text-xs font-semibold ${
      kind === 'agent' ? 'rounded-lg bg-agent/15 font-mono text-agent' : 'rounded-full bg-signal/15 text-signal'
    }`}
  >
    {initials(name)}
  </span>
);
