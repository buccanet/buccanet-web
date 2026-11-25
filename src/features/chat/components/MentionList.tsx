import type { MemberInfo } from '@/sdk/types';

interface MentionListProps {
  candidates: MemberInfo[];
  picked: number;
  onPick: (member: MemberInfo) => void;
}

/** The members an `@` can name, above the message field. */
export const MentionList = ({ candidates, picked, onPick }: MentionListProps) => (
  <ul role="listbox" aria-label="Members to name" className="absolute bottom-full left-3 mb-1 w-64 overflow-hidden rounded-xl border border-line bg-ink-2 py-1">
    {candidates.map((member, index) => (
      <li key={member.deviceId} role="option" aria-selected={index === picked}>
        <button
          type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(member)}
          className={`w-full truncate px-3 py-1.5 text-left text-sm ${index === picked ? 'bg-ink-3 text-chalk' : 'text-chalk-2'}`}
        >
          @{member.name}
          <span className="text-xs text-chalk-2"> · {member.kind === 'agent' ? 'agent' : 'person'}</span>
        </button>
      </li>
    ))}
  </ul>
);
