'use client';

import { type ProfileEdit, type ProfileRow, profileEditSchema } from '@resume-hub/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type ProfileStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';

type FieldErrors = Partial<Record<keyof ProfileEdit, string>>;

interface UseProfileArgs {
  initial: ProfileRow;
}

interface FormValues {
  fullName: string;
  phone: string;
  headline: string;
}

function rowToFormValues(row: ProfileRow): FormValues {
  return {
    fullName: row.full_name,
    phone: row.phone ?? '',
    headline: row.headline ?? '',
  };
}

export function useProfile({ initial }: UseProfileArgs) {
  const [values, setValues] = useState<FormValues>(() => rowToFormValues(initial));
  const [baseline, setBaseline] = useState<FormValues>(() => rowToFormValues(initial));
  const [status, setStatus] = useState<ProfileStatus>('clean');
  const [lastSavedAt, setLastSavedAt] = useState<string>(initial.updated_at);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [spinnerVisible, setSpinnerVisible] = useState(false);
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty =
    values.fullName !== baseline.fullName ||
    values.phone !== baseline.phone ||
    values.headline !== baseline.headline;

  useEffect(() => {
    if (status === 'saving' || status === 'error') return;
    setStatus(dirty ? 'dirty' : 'clean');
  }, [dirty, status]);

  const setField = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError(null);
  }, []);

  const save = useCallback(async () => {
    const parsed = profileEditSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProfileEdit | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return { ok: false as const, firstErrorField: parsed.error.issues[0]?.path[0] as string };
    }

    setStatus('saving');
    setServerError(null);
    spinnerTimerRef.current = setTimeout(() => setSpinnerVisible(true), 200);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: parsed.data.fullName,
        phone: parsed.data.phone?.trim() || null,
        headline: parsed.data.headline?.trim() || null,
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
      setStatus('error');
      setServerError(error?.message ?? '저장에 실패했습니다.');
      return { ok: false as const };
    }

    const row = data as ProfileRow;
    const next = rowToFormValues(row);
    setBaseline(next);
    setValues(next);
    setLastSavedAt(row.updated_at);
    setStatus('saved');
    return { ok: true as const };
  }, [values, initial.user_id]);

  useEffect(
    () => () => {
      if (spinnerTimerRef.current) clearTimeout(spinnerTimerRef.current);
    },
    [],
  );

  return {
    values,
    setField,
    status,
    dirty,
    lastSavedAt,
    fieldErrors,
    serverError,
    spinnerVisible,
    save,
    email: initial.email,
  };
}
