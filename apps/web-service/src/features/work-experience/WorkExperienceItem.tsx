'use client';

import {
  rowToWorkExperienceForm,
  type WorkExperienceEdit,
  type WorkExperienceRow,
} from '@resume-hub/shared';
import { Button } from '@resume-hub/ui';
import { useState } from 'react';
import { WorkExperienceForm } from './WorkExperienceForm';

interface Props {
  row: WorkExperienceRow;
  editable: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onSave: (values: WorkExperienceEdit) => Promise<{ ok: boolean }>;
  onDelete: () => Promise<{ ok: boolean }>;
}

function formatMonth(ymd: string): string {
  return `${ymd.slice(0, 4)}.${ymd.slice(5, 7)}`;
}

function formatPeriod(row: WorkExperienceRow): string {
  const start = formatMonth(row.start_date);
  const end = row.end_date ? formatMonth(row.end_date) : '현재';
  return `${start} — ${end}`;
}

export function WorkExperienceItem({
  row,
  editable,
  onEditStart,
  onEditEnd,
  onSave,
  onDelete,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <article className="rounded-[8px] border border-[color:var(--color-border-whisper)] bg-surface p-4 transition-[background-color] motion-safe:transition-[height]">
        <WorkExperienceForm
          initial={rowToWorkExperienceForm(row)}
          autoFocus
          onSave={async (values) => {
            const result = await onSave(values);
            if (result.ok) {
              setIsEditing(false);
              onEditEnd();
            }
            return result;
          }}
          onCancel={() => {
            setIsEditing(false);
            onEditEnd();
          }}
          onDelete={async () => {
            const confirmed = window.confirm(
              `'${row.company} · ${row.role}' 경력을 삭제하시겠습니까?`,
            );
            if (!confirmed) return;
            const result = await onDelete();
            if (result.ok) {
              setIsEditing(false);
              onEditEnd();
            }
          }}
        />
      </article>
    );
  }

  return (
    <article className="group flex items-start justify-between gap-3 rounded-[8px] border border-[color:var(--color-border-whisper)] bg-surface p-4 transition-colors hover:border-warm-300">
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-base font-semibold text-ink">{row.company}</h3>
          <span className="text-sm text-warm-500">·</span>
          <p className="text-base text-ink">{row.role}</p>
        </header>
        <p className="mt-1 text-sm text-warm-500">{formatPeriod(row)}</p>
        {row.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-[1.5] text-ink">
            {row.description}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => {
          setIsEditing(true);
          onEditStart();
        }}
        disabled={!editable}
        aria-label={`${row.company} · ${row.role} 경력 편집`}
        className="opacity-60 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        편집
      </Button>
    </article>
  );
}
