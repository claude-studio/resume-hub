import type { HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  as?: 'p' | 'span' | 'div';
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'muted' | 'subtle';
}

const sizeStyles: Record<NonNullable<TextProps['size']>, string> = {
  sm: 'text-[14px] leading-[1.43]',
  md: 'text-[16px] leading-[1.5]',
  lg: 'text-[20px] leading-[1.4] tracking-[-0.008em]',
};

const toneStyles: Record<NonNullable<TextProps['tone']>, string> = {
  default: 'text-ink',
  muted: 'text-warm-500',
  subtle: 'text-warm-300',
};

export function Text({
  as: Tag = 'p',
  size = 'md',
  tone = 'default',
  className,
  ...props
}: TextProps) {
  return <Tag className={cn(sizeStyles[size], toneStyles[tone], className)} {...props} />;
}
