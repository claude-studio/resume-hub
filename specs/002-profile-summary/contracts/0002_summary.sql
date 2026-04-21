-- Migration: add summary column to public.profiles
-- Mirrors supabase/migrations/0002_summary.sql.

-- Nullable text column with a code-point length check (matches client Zod).
alter table public.profiles
  add column summary text
    check (summary is null or char_length(summary) <= 1000);

comment on column public.profiles.summary is
  'Long-form self-introduction, up to 1000 code points. Optional.';

-- No RLS policy changes needed — existing profiles_select_own / _update_own
-- policies cover any column access by the row owner.
-- No backfill required: existing rows default to NULL.
