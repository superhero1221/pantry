-- Pantry: carry the app's own state on the profile row.
--
-- The pantry-globe schema already had profiles with 1-4 tier columns for the
-- old Next.js build. Those stay untouched; this adds what this app actually
-- keeps about you. Everything here is optional — the app works signed out, and
-- these columns only exist so the same account works on your phone and laptop.

alter table public.profiles
  add column if not exists goal            text,
  add column if not exists language        text        not null default 'en',
  add column if not exists max_time        smallint    not null default 60,
  -- profiles.budget is the old 1-4 tier. This is the actual number, in GBP
  -- base, converted for display the same way every other price is.
  add column if not exists budget_amount   numeric(10,2) not null default 6,
  add column if not exists streak          smallint    not null default 0,
  -- Which technique card sits in which tier row: {"onion":"S","fry":"C"}
  add column if not exists skill_cards     jsonb       not null default '{}'::jsonb,
  add column if not exists time_cards      jsonb       not null default '{}'::jsonb,
  -- Only what you answered out loud. Nothing is inferred and stored quietly.
  add column if not exists learned         jsonb       not null default '{}'::jsonb,
  add column if not exists dismissed       jsonb       not null default '{}'::jsonb,
  add column if not exists nudges          jsonb       not null default
                                             '{"leftover":true,"shrink":true,"shop":false}'::jsonb,
  add column if not exists onboarded       boolean     not null default false;

alter table public.profiles
  drop constraint if exists profiles_language_check;
alter table public.profiles
  add constraint profiles_language_check
  check (language in ('en', 'es', 'fr', 'pl', 'ur', 'ar'));

alter table public.profiles
  drop constraint if exists profiles_goal_check;
alter table public.profiles
  add constraint profiles_goal_check
  check (goal is null or goal in ('lose', 'gain', 'muscle', 'recomp', 'cheap', 'energy'));

-- A profile row should exist from the moment the account does, so the client
-- never has to branch on "signed in but no row yet".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Backfill the row for the account that already exists.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by their owner" on public.profiles;
create policy "profiles are readable by their owner"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "profiles are writable by their owner" on public.profiles;
create policy "profiles are writable by their owner"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "profiles are insertable by their owner" on public.profiles;
create policy "profiles are insertable by their owner"
  on public.profiles for insert
  with check ((select auth.uid()) = id);
