import type { HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  as?: 'p' | 'span' | 'div';
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'muted';
}

const sizeStyles: Record<NonNullable<TextProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const toneStyles: Record<NonNullable<TextProps['tone']>, string> = {
  default: 'text-neutral-900',
  muted: 'text-neutral-500',
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
