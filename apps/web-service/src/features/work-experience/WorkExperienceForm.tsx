'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  codePointCount,
  type WorkExperienceEdit,
  workExperienceEditSchema,
} from '@resume-hub/shared';
import { Button, FormField, MonthInput } from '@resume-hub/ui';
import { type FormEvent, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

interface Props {
  initial: WorkExperienceEdit;
  onSave: (values: WorkExperienceEdit) => Promise<{ ok: boolean }>;
  onCancel: () => void;
  onDelete?: () => void;
  autoFocus?: boolean;
}

export function WorkExperienceForm({ initial, onSave, onCancel, onDelete, autoFocus }: Props) {
  const form = useForm<WorkExperienceEdit>({
    mode: 'onTouched',
    resolver: zodResolver(workExperienceEditSchema),
    defaultValues: initial,
  });

  const {
    register,
    watch,
    setFocus,
    setValue,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  const companyRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) setFocus('company');
  }, [autoFocus, setFocus]);

  // "현재 재직 중" derived state: endMonth empty means current.
  const endMonth = watch('endMonth');
  const isCurrent = !endMonth;

  function toggleCurrent(checked: boolean) {
    if (checked) {
      setValue('endMonth', '', { shouldDirty: true, shouldValidate: true });
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = `${today.getMonth() + 1}`.padStart(2, '0');
      setValue('endMonth', `${yyyy}-${mm}`, { shouldDirty: true, shouldValidate: true });
    }
  }

  useEffect(() => {
    if (!isDirty || isSubmitting) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, isSubmitting]);

  const descriptionValue = watch('description') ?? '';
  const descLen = codePointCount(descriptionValue);
  const descAtMax = descLen >= 500;
  const descWarn = descLen >= 400 && !descAtMax;

  const onSubmit = handleSubmit(async (values) => {
    await onSave(values);
  });

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void onSubmit(e);
  }

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="company" label="회사" required error={errors.company?.message}>
          <input
            {...register('company')}
            ref={(el) => {
              companyRef.current = el;
              register('company').ref(el);
            }}
            type="text"
            autoComplete="organization"
            className="w-full min-h-[44px] rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-base text-ink outline-none transition-[border-color,box-shadow] focus:border-accent-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent-focus)_22%,transparent)]"
          />
        </FormField>
        <FormField id="role" label="역할" required error={errors.role?.message}>
          <input
            {...register('role')}
            type="text"
            autoComplete="organization-title"
            className="w-full min-h-[44px] rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-base text-ink outline-none transition-[border-color,box-shadow] focus:border-accent-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent-focus)_22%,transparent)]"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="startMonth" label="시작" required error={errors.startMonth?.message}>
          <MonthInput {...register('startMonth')} />
        </FormField>
        <FormField id="endMonth" label="종료" error={errors.endMonth?.message}>
          <MonthInput {...register('endMonth')} disabled={isCurrent} />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm text-warm-500">
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => toggleCurrent(e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-[color:var(--color-accent)]"
        />
        현재 재직 중
      </label>

      <FormField
        id="description"
        label="설명"
        error={errors.description?.message}
        trailing={
          <output
            htmlFor="description"
            className={`text-[0.8125rem] ${
              descAtMax
                ? 'font-medium text-[color:var(--color-danger)]'
                : descWarn
                  ? 'text-accent-focus'
                  : 'text-warm-500'
            }`}
          >
            {descLen} / 500
          </output>
        }
      >
        <textarea
          {...register('description')}
          placeholder="예: 주요 책임·성과·스택. bullet 형식으로 작성해도 좋습니다."
          rows={3}
          maxLength={500}
          autoComplete="off"
          className="w-full min-h-[5rem] resize-none rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-base leading-[1.5] text-ink outline-none transition-[border-color,box-shadow] focus:border-accent-focus focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent-focus)_22%,transparent)]"
        />
      </FormField>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              삭제
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>
    </form>
  );
}
