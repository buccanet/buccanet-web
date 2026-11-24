interface ToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** A switch drawn by the app: a button with role switch, no native checkbox chrome. */
export const Toggle = ({ label, hint, checked, onChange }: ToggleProps) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {hint ? <p className="text-xs text-chalk-2">{hint}</p> : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-signal' : 'bg-ink-3 border border-line'}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full transition-all ${checked ? 'left-[22px] bg-signal-ink' : 'left-0.5 bg-chalk-2'}`} />
    </button>
  </div>
);
