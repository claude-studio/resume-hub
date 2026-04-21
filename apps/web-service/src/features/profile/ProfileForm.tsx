'use client';

import type { ProfileRow } from '@resume-hub/shared';
import { Button, FormField } from '@resume-hub/ui';
import { type FormEvent, useEffect } from 'react';
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

  const hours = d.getHours();
  const ampm = hours < 12 ? '오전' : '오후';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minute = d.getMinutes().toString().padStart(2, '0');
  const time = `${ampm} ${hour12}:${minute}`;

  return sameDay ? `오늘 ${time}` : `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

export function ProfileForm({ initial }: Props) {
  const { form, onSubmit, saveStatus, lastSavedAt, serverError, spinnerVisible, email } =
    useProfile({ initial });

  const {
    register,
    setFocus,
    watch,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    setFocus('fullName');
  }, [setFocus]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void onSubmit();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSubmit]);

  // Dirty 상태일 때 페이지를 떠나면 브라우저 기본 확인 다이얼로그 표시.
  // Stressed 이직 준비자 페르소나 — 실수로 탭 닫거나 뒤로가기 방지.
  useEffect(() => {
    if (!isDirty || saveStatus === 'saving') return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, saveStatus]);

  const headlineValue = watch('headline') ?? '';
  const headlineLen = headlineValue.length;
  const headlineAtMax = headlineLen >= 200;
  const headlineWarn = headlineLen >= 160 && !headlineAtMax;

  const saveButtonLabel =
    saveStatus === 'saving' ? '저장 중…' : saveStatus === 'saved' && !isDirty ? '저장됨' : '저장';

  const statusLine =
    saveStatus === 'saving'
      ? '저장 중…'
      : isDirty
        ? '· 변경사항 있음'
        : `저장됨 · ${formatSavedAt(lastSavedAt)}`;

  // 명시적 preventDefault로 네이티브 폼 submit(GET 네비게이션)을 차단.
  // RHF의 handleSubmit이 내부에서도 preventDefault를 부르지만, 일부 React 19 +
  // Next.js 15 조합에서 제대로 동작하지 않는 케이스가 관측되어 방어 코드 유지.
  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void onSubmit(e);
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      noValidate
      className="flex flex-col gap-6"
      aria-label="프로필 편집"
    >
      <div className="flex flex-col gap-3">
        <h1 className="text-[40px] font-bold leading-[1.1] tracking-[-0.012em] text-ink">프로필</h1>
        <p className="text-[16px] leading-[1.5] text-warm-500">
          플랫폼 이력서 폼이 자동으로 채울 기본 정보입니다.
        </p>
        <p className="text-[12px] leading-[1.5] text-warm-500">
          <span aria-hidden="true" className="font-semibold text-[color:var(--color-accent)]">
            *
          </span>
          가 붙은 항목은 필수입니다.
        </p>
        <p role="status" aria-live="polite" className="text-[14px] leading-[1.43] text-warm-500">
          {spinnerVisible && <SpinnerGlyph />}
          {statusLine}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <FormField id="fullName" label="이름" required error={errors.fullName?.message}>
          <input
            type="text"
            autoComplete="name"
            {...register('fullName')}
            className="w-full rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-[16px] text-ink outline-none focus:border-accent-focus"
          />
        </FormField>

        <FormField id="email" label="이메일" hint="구글 계정 이메일이 사용됩니다 · 수정 불가">
          <input
            type="email"
            autoComplete="email"
            value={email}
            readOnly
            disabled
            tabIndex={-1}
            className="w-full cursor-not-allowed select-all rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface-warm px-3 py-2 text-[16px] text-warm-500"
          />
        </FormField>

        <FormField id="phone" label="전화번호" error={errors.phone?.message}>
          <input
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            placeholder="010-0000-0000"
            className="w-full rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-[16px] text-ink outline-none focus:border-accent-focus"
          />
        </FormField>

        <FormField
          id="headline"
          label="한 줄 소개"
          error={errors.headline?.message}
          trailing={
            <output
              htmlFor="headline"
              className={`text-[13px] ${
                headlineAtMax
                  ? 'font-medium text-[color:var(--color-danger)]'
                  : headlineWarn
                    ? 'text-accent-focus'
                    : 'text-warm-500'
              }`}
            >
              {headlineLen} / 200
            </output>
          }
        >
          <textarea
            {...register('headline')}
            placeholder="예: 5년차 프론트엔드 개발자, 제품 중심 팀 선호"
            rows={3}
            maxLength={200}
            className="w-full resize-none rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface px-3 py-2 text-[16px] leading-[1.5] text-ink outline-none focus:border-accent-focus"
          />
        </FormField>
      </div>

      {serverError && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-[4px] border border-[color:var(--color-border-whisper)] bg-surface-warm px-4 py-3 text-[14px] text-ink"
        >
          <span>{serverError}</span>
          <div>
            <Button variant="ghost" size="sm" onClick={() => void onSubmit()}>
              다시 시도
            </Button>
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <Button type="submit" disabled={saveStatus === 'saving'}>
          {saveButtonLabel}
        </Button>
      </div>
    </form>
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
