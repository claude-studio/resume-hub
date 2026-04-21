import { describe, expect, it } from 'vitest';
import { nowISO } from './date';

describe('nowISO', () => {
  it('returns an ISO-8601 timestamp', () => {
    const result = nowISO();
    expect(new Date(result).toISOString()).toBe(result);
  });
});
