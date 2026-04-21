import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md';
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover active:scale-[0.97]',
  secondary: 'bg-black/5 text-ink hover:bg-black/10 active:scale-[0.97]',
  ghost: 'bg-transparent text-warm-500 hover:text-ink hover:underline',
  // Outline — white bg + ink text + whisper border. 3rd-party OAuth 등
  // 중립적 "확인된 브랜드" 느낌이 필요한 CTA에 사용.
  outline:
    'bg-surface text-ink border border-[color:var(--color-border-whisper)] hover:bg-surface-warm active:scale-[0.97]',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'h-7 px-2 text-[13px]',
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-[15px] font-semibold',
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-[4px] font-medium transition-[background-color,transform] disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-focus',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
