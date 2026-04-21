/**
 * Contract: Zod validation schema for Profile edits (updated for summary).
 * Source of truth for the implementation at
 * `packages/shared/src/schemas/profile.ts`.
 *
 * Key decision: summary length is validated by code-point count
 * (Array.from(str).length), matching PostgreSQL char_length().
 * Plain z.string().max(1000) would use UTF-16 code units and drift from DB.
 */
import { z } from 'zod';

function codePointCount(value: string): number {
  return Array.from(value).length;
}

export const profileEditSchema = z.object({
  fullName: z.string().trim().min(1, '이름을 입력해주세요').max(80, '이름이 너무 깁니다'),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\-\s()]*$/, '전화번호 형식이 올바르지 않습니다')
    .max(32, '전화번호가 너무 깁니다')
    .optional()
    .or(z.literal('')),
  headline: z.string().max(200, '한 줄 소개는 200자 이하여야 합니다').optional().or(z.literal('')),
  summary: z
    .string()
    .refine((v) => codePointCount(v) <= 1000, '자기소개는 1000자 이하여야 합니다')
    .optional()
    .or(z.literal('')),
});

export type ProfileEdit = z.infer<typeof profileEditSchema>;

export interface ProfileRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  headline: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export { codePointCount };
