'use client';

import {
  type WorkExperienceEdit,
  type WorkExperienceRow,
  workExperienceFormToInsert,
} from '@resume-hub/shared';
import { useCallback, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type MutationError = { code?: string; message?: string } | null;

function mapError(error: MutationError): string {
  if (!error) return '작업에 실패했습니다. 잠시 후 다시 시도해주세요.';
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
  return msg || '작업에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

/**
 * Orders rows per FR-004: current jobs (end_date null) first,
 * then reverse-chronological by start_date.
 */
function sortRows(rows: WorkExperienceRow[]): WorkExperienceRow[] {
  return [...rows].sort((a, b) => {
    const aCurrent = a.end_date === null;
    const bCurrent = b.end_date === null;
    if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;
    return b.start_date.localeCompare(a.start_date);
  });
}

export function useWorkExperiences({
  initial,
  userId,
}: {
  initial: WorkExperienceRow[];
  userId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<WorkExperienceRow[]>(() => sortRows(initial));
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(
    async (values: WorkExperienceEdit) => {
      setError(null);
      const payload = workExperienceFormToInsert(values, userId);
      const { data, error: err } = await supabase
        .from('work_experiences')
        .insert(payload)
        .select()
        .single();
      if (err || !data) {
        setError(mapError(err));
        return { ok: false as const };
      }
      setItems((prev) => sortRows([...prev, data as WorkExperienceRow]));
      return { ok: true as const, row: data as WorkExperienceRow };
    },
    [supabase, userId],
  );

  const update = useCallback(
    async (id: string, values: WorkExperienceEdit) => {
      setError(null);
      const payload = workExperienceFormToInsert(values, userId);
      const { data, error: err } = await supabase
        .from('work_experiences')
        .update({
          company: payload.company,
          role: payload.role,
          start_date: payload.start_date,
          end_date: payload.end_date,
          description: payload.description,
        })
        .eq('id', id)
        .select()
        .single();
      if (err || !data) {
        setError(mapError(err));
        return { ok: false as const };
      }
      setItems((prev) =>
        sortRows(prev.map((item) => (item.id === id ? (data as WorkExperienceRow) : item))),
      );
      return { ok: true as const, row: data as WorkExperienceRow };
    },
    [supabase, userId],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      const prev = items;
      setItems((current) => current.filter((item) => item.id !== id));
      const { error: err } = await supabase.from('work_experiences').delete().eq('id', id);
      if (err) {
        setItems(prev);
        setError(mapError(err));
        return { ok: false as const };
      }
      return { ok: true as const };
    },
    [supabase, items],
  );

  return { items, add, update, remove, error };
}
