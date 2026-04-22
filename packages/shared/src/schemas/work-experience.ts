import { z } from 'zod';
import { codePointCount } from './profile';

const monthString = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
  message: '올바른 월(YYYY-MM)을 입력해주세요',
});

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
      return data.endMonth >= data.startMonth;
    },
    {
      message: '종료일은 시작일 이후여야 합니다',
      path: ['endMonth'],
    },
  );

export type WorkExperienceEdit = z.infer<typeof workExperienceEditSchema>;

export interface WorkExperienceRow {
  id: string;
  user_id: string;
  company: string;
  role: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const WORK_EXPERIENCE_MAX_COUNT = 50;

export function rowToWorkExperienceForm(row: WorkExperienceRow): WorkExperienceEdit {
  return {
    company: row.company,
    role: row.role,
    startMonth: row.start_date.slice(0, 7),
    endMonth: row.end_date ? row.end_date.slice(0, 7) : '',
    description: row.description ?? '',
  };
}

export function workExperienceFormToInsert(
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
