'use client';

import type { ProfileRow } from '@resume-hub/shared';
import { Button } from '@resume-hub/ui';
import { type FormEvent, useEffect, useRef } from 'react';
import { useProfile } from './useProfile';

interface Props {
  initial: ProfileRow;
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return sameDay ? `오늘 ${time}` : `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

export function ProfileForm({ initial }: Props) {
  const {
    values,
    setField,
    status,
    dirty,
    lastSavedAt,
    fieldErrors,
    serverError,
    spinnerVisible,
    save,
    email,
  } = useProfile({ initial });

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const headlineRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmitRef = useRef<() => Promise<void>>(undefined as unknown as () => Promise<void>);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSubmitRef.current?.();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    const result = await save();
    if (!result.ok && 'firstErrorField' in result && result.firstErrorField) {
      if (result.firstErrorField === 'fullName') nameRef.current?.focus();
      else if (result.firstErrorField === 'phone') phoneRef.current?.focus();
      else if (result.firstErrorField === 'headline') headlineRef.current?.focus();
    }
  }

  handleSubmitRef.current = () => handleSubmit();

  const saveButtonLabel =
    status === 'saving' ? '저장 중…' : status === 'clean' && !dirty ? '저장됨' : '저장';

  const statusLine =
    status === 'saving'
      ? '저장 중…'
      : dirty
        ? '· 변경사항 있음'
        : `저장됨 · ${formatSavedAt(lastSavedAt)}`;

  const headlineLen = values.headline.length;
  const headlineWarn = headlineLen >= 160;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
      aria-label="프로필 편집"
    >
      <div className="flex flex-col gap-3">
        <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-0.012em] text-ink">프로필</h1>
        <p className="text-[16px] leading-[1.5] text-warm-500">
          플랫폼 이력서 폼이 자동으로 채울 기본 정보입니다.
        </p>
        <p role="status" aria-live="polite" className="text-[14px] leading-[1.43] text-warm-500">
          {spinnerVisible && <SpinnerGlyph />}
          {statusLine}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <Field
          id="fullName"
          label="이름"
          error={fieldErrors.fullName}
          input={
            <input
              ref={nameRef}
              id="fullName"
              type="text"
              value={values.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
              className="w-full rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-[16px] text-ink outline-none focus:border-accent-focus"
            />
          }
        />

        <Field
          id="email"
          label="이메일"
          hint="구글 계정 이메일이 사용됩니다 · 수정 불가"
          input={
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              disabled
              aria-disabled="true"
              tabIndex={-1}
              className="w-full cursor-not-allowed select-all rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface-warm px-3 py-2 text-[16px] text-warm-500"
            />
          }
        />

        <Field
          id="phone"
          label="전화번호 (선택)"
          error={fieldErrors.phone}
          input={
            <input
              ref={phoneRef}
              id="phone"
              type="tel"
              value={values.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="010-0000-0000"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
              className="w-full rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-[16px] text-ink outline-none focus:border-accent-focus"
            />
          }
        />

        <Field
          id="headline"
          label="한 줄 소개 (선택)"
          error={fieldErrors.headline}
          trailing={
            <output
              htmlFor="headline"
              className={`text-[13px] ${headlineWarn ? 'text-accent-focus' : 'text-warm-500'}`}
            >
              {headlineLen} / 200
            </output>
          }
          input={
            <textarea
              ref={headlineRef}
              id="headline"
              value={values.headline}
              onChange={(e) => setField('headline', e.target.value)}
              placeholder="예: 5년차 프론트엔드 개발자, 제품 중심 팀 선호"
              rows={3}
              maxLength={240}
              aria-invalid={Boolean(fieldErrors.headline)}
              aria-describedby={fieldErrors.headline ? 'headline-error' : undefined}
              className="w-full resize-none rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-[16px] leading-[1.5] text-ink outline-none focus:border-accent-focus"
            />
          }
        />
      </div>

      {serverError && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface-warm px-4 py-3 text-[14px] text-ink"
        >
          <span>저장에 실패했습니다. 네트워크를 확인하고 다시 시도하세요.</span>
          <div>
            <Button variant="ghost" size="sm" onClick={() => void handleSubmit()}>
              다시 시도
            </Button>
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={status === 'saving' || (!dirty && status !== 'error')}>
          {saveButtonLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  input,
  error,
  hint,
  trailing,
}: {
  id: string;
  label: string;
  input: React.ReactNode;
  error?: string;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[14px] font-medium text-ink">
          {label}
        </label>
        {trailing}
      </div>
      {input}
      {hint && !error && <p className="text-[13px] text-warm-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-[13px] text-[oklch(55%_0.17_30)]">
          {error}
        </p>
      )}
    </div>
  );
}

function SpinnerGlyph() {
  return (
    <span
      aria-hidden="true"
      className="mr-1 inline-block h-[10px] w-[10px] animate-spin rounded-full border border-warm-300 border-t-warm-500 align-[-1px] motion-reduce:animate-none"
    />
  );
}
