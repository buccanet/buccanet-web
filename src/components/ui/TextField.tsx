import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export const TextField = ({ label, hint, id, className = '', ...props }: TextFieldProps) => (
  <label htmlFor={id} className="block space-y-1.5">
    <span className="text-sm font-medium">{label}</span>
    <input
      id={id}
      className={`h-11 w-full rounded-xl border border-line bg-ink-2 px-3.5 text-[15px] outline-none placeholder:text-chalk-2/60 focus:border-signal ${className}`}
      {...props}
    />
    {hint ? <span className="block text-xs text-chalk-2">{hint}</span> : null}
  </label>
);
