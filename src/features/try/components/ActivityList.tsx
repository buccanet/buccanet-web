import type { Activity, ActivityKind } from '../services/agentRunner';

const TONE: Record<ActivityKind, string> = {
  answered: 'text-signal',
  quiet: 'text-chalk-2',
  held: 'text-warn',
  waiting: 'text-warn',
  error: 'text-danger',
};

const time = (at: number): string => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** What the agent did lately, newest first. */
export const ActivityList = ({ activity }: { activity: Activity[] }) => (
  <section className="space-y-2" aria-live="polite">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-chalk-2">Recent activity</h3>
    {activity.length === 0 ? (
      <p className="text-xs text-chalk-2">Nothing yet. Name your agent in the room with @ to wake it.</p>
    ) : (
      <ul className="space-y-1.5">
        {activity.map((entry) => (
          <li key={entry.id} className={`text-xs leading-relaxed ${TONE[entry.kind]}`}>
            <span className="font-mono text-chalk-2">{time(entry.at)}</span> {entry.text}
          </li>
        ))}
      </ul>
    )}
  </section>
);
