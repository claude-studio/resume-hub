import type { ISODateString } from '../types';

export function nowISO(): ISODateString {
  return new Date().toISOString();
}
