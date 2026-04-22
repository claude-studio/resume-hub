import { describe, expect, it } from 'vitest';
import {
  rowToWorkExperienceForm,
  WORK_EXPERIENCE_MAX_COUNT,
  type WorkExperienceRow,
  workExperienceEditSchema,
  workExperienceFormToInsert,
} from './work-experience';

describe('workExperienceEditSchema', () => {
  const base = {
    company: 'Acme Corp',
    role: 'Senior Engineer',
    startMonth: '2023-01',
  };

  it('accepts minimum valid input', () => {
    expect(workExperienceEditSchema.safeParse(base).success).toBe(true);
  });

  it('rejects empty company', () => {
    expect(workExperienceEditSchema.safeParse({ ...base, company: '' }).success).toBe(false);
  });

  it('rejects empty role', () => {
    expect(workExperienceEditSchema.safeParse({ ...base, role: ' ' }).success).toBe(false);
  });

  it('rejects company longer than 100', () => {
    const result = workExperienceEditSchema.safeParse({ ...base, company: 'x'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid month format', () => {
    expect(workExperienceEditSchema.safeParse({ ...base, startMonth: '2023-13' }).success).toBe(
      false,
    );
    expect(workExperienceEditSchema.safeParse({ ...base, startMonth: '2023/01' }).success).toBe(
      false,
    );
    expect(workExperienceEditSchema.safeParse({ ...base, startMonth: '23-01' }).success).toBe(
      false,
    );
  });

  it('accepts omitted or empty endMonth (current job)', () => {
    expect(workExperienceEditSchema.safeParse({ ...base }).success).toBe(true);
    expect(workExperienceEditSchema.safeParse({ ...base, endMonth: '' }).success).toBe(true);
  });

  it('rejects endMonth before startMonth', () => {
    const result = workExperienceEditSchema.safeParse({
      ...base,
      startMonth: '2024-06',
      endMonth: '2023-12',
    });
    expect(result.success).toBe(false);
  });

  it('accepts endMonth equal to startMonth', () => {
    const result = workExperienceEditSchema.safeParse({
      ...base,
      startMonth: '2024-01',
      endMonth: '2024-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts description with exactly 500 code points including emoji', () => {
    const emoji = '🙂'.repeat(500); // 500 code points, 1000 UTF-16 units
    const result = workExperienceEditSchema.safeParse({ ...base, description: emoji });
    expect(result.success).toBe(true);
  });

  it('rejects description longer than 500 code points', () => {
    const result = workExperienceEditSchema.safeParse({ ...base, description: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe('WORK_EXPERIENCE_MAX_COUNT', () => {
  it('is 50 per spec FR-012', () => {
    expect(WORK_EXPERIENCE_MAX_COUNT).toBe(50);
  });
});

describe('row ↔ form converters', () => {
  const row: WorkExperienceRow = {
    id: 'w1',
    user_id: 'u1',
    company: 'Acme',
    role: 'Engineer',
    start_date: '2023-01-01',
    end_date: '2024-06-01',
    description: 'did stuff',
    created_at: '2026-04-22T00:00:00Z',
    updated_at: '2026-04-22T00:00:00Z',
  };

  it('rowToWorkExperienceForm truncates dates to YYYY-MM', () => {
    const form = rowToWorkExperienceForm(row);
    expect(form.startMonth).toBe('2023-01');
    expect(form.endMonth).toBe('2024-06');
  });

  it('rowToWorkExperienceForm maps null end_date to empty endMonth', () => {
    const form = rowToWorkExperienceForm({ ...row, end_date: null });
    expect(form.endMonth).toBe('');
  });

  it('workExperienceFormToInsert adds -01 suffix and handles empty endMonth', () => {
    const insert = workExperienceFormToInsert(
      { company: ' Acme ', role: ' Eng ', startMonth: '2023-01', endMonth: '', description: '' },
      'u1',
    );
    expect(insert.start_date).toBe('2023-01-01');
    expect(insert.end_date).toBeNull();
    expect(insert.company).toBe('Acme');
    expect(insert.role).toBe('Eng');
    expect(insert.description).toBeNull();
  });
});
