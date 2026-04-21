import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
  /** Single input or textarea element. id/aria-* are injected automatically. */
  children: ReactElement<Record<string, unknown>>;
  className?: string;
}

/**
 * Form field wrapper with label, optional required asterisk, error/hint slots,
 * and automatic ARIA wiring. Accepts a single input/textarea child and injects
 * `id`, `aria-describedby`, and `aria-invalid` based on props.
 */
export function FormField({
  id,
  label,
  required,
  error,
  hint,
  trailing,
  children,
  className,
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = !error && hint ? `${id}-hint` : undefined;
  const describedBy = errorId ?? hintId;

  const child = Children.only(children);
  if (!isValidElement(child)) {
    throw new Error('<FormField> expects exactly one element child.');
  }
  const injected = cloneElement(child, {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': required || undefined,
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[14px] font-medium text-ink">
          {required && (
            <span aria-hidden="true" className="font-semibold text-[color:var(--color-accent)]">
              *
            </span>
          )}
          {label}
          {required && <span className="sr-only"> (필수)</span>}
        </label>
        {trailing}
      </div>
      {injected}
      {hint && !error && (
        <p id={hintId} className="text-[13px] text-warm-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[13px] text-[color:var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
