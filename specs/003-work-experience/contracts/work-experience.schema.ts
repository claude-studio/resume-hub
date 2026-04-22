/**
 * Contract: Zod validation schemas + types for Work Experience.
 * Source of truth for `packages/shared/src/schemas/work-experience.ts`.
 */
import { z } from 'zod';

// "YYYY-MM" matching <input type="month"> output format.
const monthString = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
  message: '올바른 월(YYYY-MM)을 입력해주세요',
});

function codePointCount(value: string): number {
  return Array.from(value).length;
}

export const workExperienceEditSchema = z
  .object({
    company: z.string().trim().min(1, '회사명을 입력해주세요').max(100, '회사명이 너무 깁니다'),
    role: z.string().trim().min(1, '역할을 입력해주세요').max(100, '역할이 너무 깁니다'),
    startMonth: monthString,
    endMonth: monthString.optional().or(z.literal('')),
    description: z
      .string()
      .refine((v) => codePointCount(v) <= 500, '설명은 500자 이하여야 합니다')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (!data.endMonth) return true;
      return data.endMonth >= data.startMonth; // lexical compare works for YYYY-MM
    },
    {
      message: '종료일은 시작일 이후여야 합니다',
      path: ['endMonth'],
    },
  );

export type WorkExperienceEdit = z.infer<typeof workExperienceEditSchema>;

/** Shape as stored in DB (snake_case dates are full YYYY-MM-DD). */
export interface WorkExperienceRow {
  id: string;
  user_id: string;
  company: string;
  role: string;
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Client-side constant mirroring spec FR-012. */
export const WORK_EXPERIENCE_MAX_COUNT = 50;

// Conversion helpers used at the hook boundary.
export function rowToFormValues(row: WorkExperienceRow): WorkExperienceEdit {
  return {
    company: row.company,
    role: row.role,
    startMonth: row.start_date.slice(0, 7), // YYYY-MM-DD -> YYYY-MM
    endMonth: row.end_date ? row.end_date.slice(0, 7) : '',
    description: row.description ?? '',
  };
}

export function formValuesToInsertPayload(
  values: WorkExperienceEdit,
  userId: string,
): Omit<WorkExperienceRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    company: values.company.trim(),
    role: values.role.trim(),
    start_date: `${values.startMonth}-01`,
    end_date: values.endMonth ? `${values.endMonth}-01` : null,
    description: values.description?.trim() || null,
  };
}

export { codePointCount };
