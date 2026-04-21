import { describe, expect, it } from 'vitest';
import { profileEditSchema } from './profile';

describe('profileEditSchema', () => {
  it('accepts minimum valid input (name only)', () => {
    const result = profileEditSchema.safeParse({ fullName: 'Samuel' });
    expect(result.success).toBe(true);
  });

  it('rejects empty or whitespace-only name', () => {
    expect(profileEditSchema.safeParse({ fullName: '' }).success).toBe(false);
    expect(profileEditSchema.safeParse({ fullName: '   ' }).success).toBe(false);
  });

  it('rejects name longer than 80 characters', () => {
    const result = profileEditSchema.safeParse({ fullName: 'x'.repeat(81) });
    expect(result.success).toBe(false);
  });

  it('accepts valid phone formats', () => {
    const valid = ['010-1234-5678', '+82 10 1234 5678', '(02) 123 4567', ''];
    for (const phone of valid) {
      const result = profileEditSchema.safeParse({ fullName: '홍길동', phone });
      expect(result.success, `phone="${phone}" should be valid`).toBe(true);
    }
  });

  it('rejects phone with letters or disallowed symbols', () => {
    const invalid = ['abc-def', '010-****-5678', '010_1234_5678'];
    for (const phone of invalid) {
      const result = profileEditSchema.safeParse({ fullName: '홍길동', phone });
      expect(result.success, `phone="${phone}" should be invalid`).toBe(false);
    }
  });

  it('rejects headline longer than 200 characters', () => {
    const result = profileEditSchema.safeParse({
      fullName: '홍길동',
      headline: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be omitted or empty', () => {
    const result = profileEditSchema.safeParse({
      fullName: '홍길동',
      phone: '',
      headline: '',
    });
    expect(result.success).toBe(true);
  });
});
