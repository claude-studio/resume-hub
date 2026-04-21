-- Migration: profiles table + RLS + auto-provisioning trigger
-- Mirrors specs/001-auth-profile/contracts/rls-policies.sql (source of truth).
-- Any change here must also be reflected in the contract file.

---------------------------------------------------------------------
-- 1. Table
---------------------------------------------------------------------
create table public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text        not null check (char_length(trim(full_name)) > 0),
  email       text        not null,
  phone       text        check (phone is null or char_length(phone) between 1 and 32),
  headline    text        check (headline is null or char_length(headline) <= 200),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Auto-provisioned by on_auth_user_created trigger.';

---------------------------------------------------------------------
-- 2. updated_at trigger
---------------------------------------------------------------------
create or replace function public.set_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

---------------------------------------------------------------------
-- 3. Block email edits (enforce read-only at DB layer)
---------------------------------------------------------------------
create or replace function public.block_profiles_email_update()
returns trigger language plpgsql as $$
begin
  if new.email is distinct from old.email then
    raise exception 'profiles.email is read-only';
  end if;
  return new;
end;
$$;

create trigger trg_profiles_block_email_update
  before update on public.profiles
  for each row execute function public.block_profiles_email_update();

---------------------------------------------------------------------
-- 4. Auto-provision profile on new auth user
---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

---------------------------------------------------------------------
-- 5. Row Level Security
---------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = user_id);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id)
            with check (auth.uid() = user_id);

-- No DELETE policy: delete is disallowed via API. Cascade from auth.users only.
