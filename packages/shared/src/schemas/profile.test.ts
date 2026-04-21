import { describe, expect, it } from 'vitest';
import { codePointCount, profileEditSchema } from './profile';

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
      summary: '',
    });
    expect(result.success).toBe(true);
  });

  describe('summary', () => {
    it('accepts 1000 code points exactly', () => {
      const result = profileEditSchema.safeParse({
        fullName: '홍길동',
        summary: 'a'.repeat(1000),
      });
      expect(result.success).toBe(true);
    });

    it('rejects 1001 code points', () => {
      const result = profileEditSchema.safeParse({
        fullName: '홍길동',
        summary: 'a'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it('counts emoji by code points, not UTF-16 code units', () => {
      // '🙂' is 1 code point but 2 UTF-16 code units.
      // 500 emoji = 500 code points, well under 1000.
      const result = profileEditSchema.safeParse({
        fullName: '홍길동',
        summary: '🙂'.repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it('rejects 1001-code-point emoji string', () => {
      const result = profileEditSchema.safeParse({
        fullName: '홍길동',
        summary: '🙂'.repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it('accepts newlines and unicode preserved', () => {
      const result = profileEditSchema.safeParse({
        fullName: '홍길동',
        summary: '첫 줄\n둘째 줄\n\n빈 줄 뒤 내용',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('codePointCount', () => {
  it('counts ASCII by char count', () => {
    expect(codePointCount('hello')).toBe(5);
  });

  it('counts Korean by grapheme count (mostly equivalent)', () => {
    expect(codePointCount('안녕하세요')).toBe(5);
  });

  it('counts emoji as 1 code point', () => {
    expect(codePointCount('🙂')).toBe(1);
    expect(codePointCount('🙂🙂🙂')).toBe(3);
  });

  it('differs from string.length on emoji', () => {
    expect('🙂'.length).toBe(2);
    expect(codePointCount('🙂')).toBe(1);
  });
});
