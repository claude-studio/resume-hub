'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ProfileEdit, type ProfileRow, profileEditSchema } from '@resume-hub/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';

export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';

/**
 * Supabase 에러 객체를 사용자 친화 메시지로 매핑.
 * - JWT/session 만료 → 재로그인 안내
 * - RLS 위반 (42501) → 권한 오류
 * - 네트워크/기타 → 기본 메시지 (+ 원인 힌트)
 */
function mapSaveError(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return '저장에 실패했습니다. 잠시 후 다시 시도해주세요.';
  const msg = error.message ?? '';
  if (error.code === '42501' || /row-level security/i.test(msg)) {
    return '권한이 없습니다. 다시 로그인 후 시도해주세요.';
  }
  if (/jwt|session|unauthenticated/i.test(msg)) {
    return '세션이 만료되었습니다. 다시 로그인 후 시도해주세요.';
  }
  if (/network|fetch|failed to fetch/i.test(msg)) {
    return '네트워크 연결을 확인하고 다시 시도해주세요.';
  }
  return `저장에 실패했습니다. ${msg || '잠시 후 다시 시도해주세요.'}`;
}

function rowToValues(row: ProfileRow): ProfileEdit {
  return {
    fullName: row.full_name,
    phone: row.phone ?? '',
    headline: row.headline ?? '',
  };
}

export function useProfile({ initial }: { initial: ProfileRow }) {
  const form = useForm<ProfileEdit>({
    mode: 'onTouched',
    resolver: zodResolver(profileEditSchema),
    defaultValues: rowToValues(initial),
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('clean');
  const [lastSavedAt, setLastSavedAt] = useState<string>(initial.updated_at);
  const [serverError, setServerError] = useState<string | null>(null);
  const [spinnerVisible, setSpinnerVisible] = useState(false);
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    // Don't override in-flight writes.
    if (saveStatus === 'saving') return;

    // "저장됨"과 "error" 상태는 다음 편집이 시작되기 전까지 유지.
    // 사용자가 다시 타이핑하면 dirty로 자연 전이.
    if (saveStatus === 'saved' || saveStatus === 'error') {
      if (isDirty) setSaveStatus('dirty');
      return;
    }

    // clean ↔ dirty 일반 전이
    setSaveStatus(isDirty ? 'dirty' : 'clean');
  }, [isDirty, saveStatus]);

  const save = useCallback(
    async (values: ProfileEdit) => {
      // Nothing changed — skip the network round-trip, just confirm the
      // "saved" state visually. This keeps the always-enabled save button
      // from adding DB load when users re-click on an already-clean form.
      if (!form.formState.isDirty) {
        setSaveStatus('saved');
        return;
      }

      setSaveStatus('saving');
      setServerError(null);
      spinnerTimerRef.current = setTimeout(() => setSpinnerVisible(true), 200);

      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: values.fullName,
          phone: values.phone?.trim() || null,
          headline: values.headline?.trim() || null,
        })
        .eq('user_id', initial.user_id)
        .select()
        .single();

      if (spinnerTimerRef.current) {
        clearTimeout(spinnerTimerRef.current);
        spinnerTimerRef.current = null;
      }
      setSpinnerVisible(false);

      if (error || !data) {
        setSaveStatus('error');
        setServerError(mapSaveError(error));
        return;
      }

      const row = data as ProfileRow;
      form.reset(rowToValues(row), { keepDefaultValues: false });
      setLastSavedAt(row.updated_at);
      setSaveStatus('saved');
    },
    [initial.user_id, form],
  );

  useEffect(
    () => () => {
      if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
    },
    [],
  );

  const onSubmit = form.handleSubmit(save, () => {
    // Zod validation failed. RHF automatically focuses the first invalid field
    // via shouldFocusError (default true).
  });

  return {
    form,
    onSubmit,
    saveStatus,
    lastSavedAt,
    serverError,
    spinnerVisible,
    email: initial.email,
    retry: () => onSubmit(),
  };
}
