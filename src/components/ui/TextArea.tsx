import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export const TextArea = ({ label, hint, id, className = '', ...props }: TextAreaProps) => (
  <label htmlFor={id} className="block space-y-1.5">
    <span className="text-sm font-medium">{label}</span>
    <textarea
      id={id}
      className={`w-full resize-y rounded-xl border border-line bg-ink-2 px-3.5 py-3 text-[15px] outline-none placeholder:text-chalk-2/60 focus:border-signal ${className}`}
      {...props}
    />
    {hint ? <span className="block text-xs text-chalk-2">{hint}</span> : null}
  </label>
);
