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
  // xs — 인라인 텍스트 링크 대체용. 모바일 주 타겟으로 쓰지 말 것.
  xs: 'h-7 px-2 text-[13px]',
  // sm — 보조 액션 (다시 시도 등). 좁은 영역 또는 버튼이 텍스트 옆에 붙어 설명을 받쳐줄 때.
  sm: 'h-9 px-3 text-sm',
  // md — 기본 CTA. WCAG 2.5.5 AAA (44×44) 만족.
  md: 'h-11 min-w-[44px] px-4 text-[15px] font-semibold',
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
