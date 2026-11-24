import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-signal text-signal-ink hover:brightness-110 font-semibold',
  ghost: 'text-chalk-2 hover:text-chalk hover:bg-ink-3',
  outline: 'border border-line text-chalk hover:border-chalk-2',
  danger: 'border border-danger/50 text-danger hover:bg-danger/10',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = ({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm transition disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    {...props}
  />
);
