'use client';

import {
  WORK_EXPERIENCE_MAX_COUNT,
  type WorkExperienceEdit,
  type WorkExperienceRow,
} from '@resume-hub/shared';
import { Button } from '@resume-hub/ui';
import { useState } from 'react';
import { useWorkExperiences } from './useWorkExperiences';
import { WorkExperienceForm } from './WorkExperienceForm';
import { WorkExperienceItem } from './WorkExperienceItem';

interface Props {
  initial: WorkExperienceRow[];
  userId: string;
}

const EMPTY_FORM: WorkExperienceEdit = {
  company: '',
  role: '',
  startMonth: '',
  endMonth: '',
  description: '',
};

export function WorkExperienceList({ initial, userId }: Props) {
  const { items, add, update, remove, error } = useWorkExperiences({ initial, userId });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const limitReached = items.length >= WORK_EXPERIENCE_MAX_COUNT;
  const canEditAny = !isAdding && editingId === null;

  async function handleAdd(values: WorkExperienceEdit) {
    const result = await add(values);
    if (result.ok) setIsAdding(false);
    return result;
  }

  if (items.length === 0 && !isAdding) {
    return (
      <section aria-labelledby="work-experience-heading" className="flex flex-col gap-4">
        <h2
          id="work-experience-heading"
          className="text-[1.75rem] font-bold leading-[1.2] tracking-[-0.012em] text-ink"
        >
          경력
        </h2>
        <div className="flex flex-col items-start gap-3 rounded-[8px] border border-[color:var(--color-border-whisper)] bg-surface-warm p-6">
          <p className="text-sm text-warm-500">
            아직 경력이 없습니다.
            <br />첫 경력을 추가해보세요.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
            + 경력 추가
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="work-experience-heading" className="flex flex-col gap-4">
      <h2
        id="work-experience-heading"
        className="text-[1.75rem] font-bold leading-[1.2] tracking-[-0.012em] text-ink"
      >
        경력
      </h2>

      <div className="flex flex-col gap-3">
        {isAdding && (
          <article className="rounded-[8px] border border-[color:var(--color-border-whisper)] bg-surface p-4">
            <WorkExperienceForm
              initial={EMPTY_FORM}
              autoFocus
              onSave={handleAdd}
              onCancel={() => setIsAdding(false)}
            />
          </article>
        )}

        {items.map((row) => (
          <WorkExperienceItem
            key={row.id}
            row={row}
            editable={canEditAny || editingId === row.id}
            onEditStart={() => setEditingId(row.id)}
            onEditEnd={() => setEditingId(null)}
            onSave={(values) => update(row.id, values)}
            onDelete={() => remove(row.id)}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error}
        </p>
      )}

      {!isAdding && (
        <div className="flex flex-col gap-1">
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAdding(true)}
              disabled={limitReached || !canEditAny}
              aria-disabled={limitReached ? 'true' : undefined}
              title={limitReached ? '최대 50건까지 등록 가능합니다' : undefined}
            >
              + 경력 추가
            </Button>
          </div>
          {limitReached && (
            <p className="text-[0.8125rem] text-warm-500">
              최대 {WORK_EXPERIENCE_MAX_COUNT}건까지 등록 가능합니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
