import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface MonthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

/**
 * Month-granularity date input (YYYY-MM). Wraps native `<input type="month">`
 * with the project's standard form styling (same shape/colors/focus ring as
 * text inputs). Falls back to a plain text input on browsers that lack native
 * support (Firefox pre-UI v133 behaves as type="text" — still accepts the
 * YYYY-MM pattern because we validate with Zod at the boundary).
 */
export const MonthInput = forwardRef<HTMLInputElement, MonthInputProps>(function MonthInput(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="month"
      className={cn(
        'w-full min-h-[44px] rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-base text-ink outline-none transition-[border-color,box-shadow] focus:border-accent-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent-focus)_22%,transparent)] disabled:cursor-not-allowed disabled:bg-surface-warm disabled:text-warm-500',
        className,
      )}
      {...props}
    />
  );
});
