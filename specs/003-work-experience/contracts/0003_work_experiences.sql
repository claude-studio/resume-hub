-- Migration: work_experiences table + RLS + updated_at trigger
-- Mirrors supabase/migrations/0003_work_experiences.sql.

---------------------------------------------------------------------
-- 1. Table
---------------------------------------------------------------------
create table public.work_experiences (
  id           uuid         primary key default gen_random_uuid(),
  user_id      uuid         not null references auth.users(id) on delete cascade,
  company      text         not null check (char_length(trim(company)) between 1 and 100),
  role         text         not null check (char_length(trim(role)) between 1 and 100),
  start_date   date         not null,
  end_date     date         check (end_date is null or end_date >= start_date),
  description  text         check (description is null or char_length(description) <= 500),
  created_at   timestamptz  not null default now(),
  updated_at   timestamptz  not null default now()
);

comment on table public.work_experiences is
  'Per-user work history entries. User has 0..~50 entries; 50 is soft-enforced in the app layer.';

---------------------------------------------------------------------
-- 2. Index for FR-004 sort (latest current job, then reverse-chronological)
---------------------------------------------------------------------
create index work_experiences_user_sort_idx
  on public.work_experiences (user_id, start_date desc);

---------------------------------------------------------------------
-- 3. updated_at trigger
---------------------------------------------------------------------
create or replace function public.set_work_experiences_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_work_experiences_set_updated_at
  before update on public.work_experiences
  for each row execute function public.set_work_experiences_updated_at();

---------------------------------------------------------------------
-- 4. Row Level Security
---------------------------------------------------------------------
alter table public.work_experiences enable row level security;

create policy work_experiences_select_own on public.work_experiences
  for select using (auth.uid() = user_id);

create policy work_experiences_insert_own on public.work_experiences
  for insert with check (auth.uid() = user_id);

create policy work_experiences_update_own on public.work_experiences
  for update using (auth.uid() = user_id)
            with check (auth.uid() = user_id);

create policy work_experiences_delete_own on public.work_experiences
  for delete using (auth.uid() = user_id);
