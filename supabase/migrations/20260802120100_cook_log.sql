-- Pantry: what you actually cooked.
--
-- The Stats screen, the Passport and the whole question engine read from this.
-- Signed out it lives in localStorage; signed in it lives here, and the two are
-- merged on sign-in rather than one clobbering the other.

create table if not exists public.cook_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  recipe_id    text not null,
  name         text not null,
  country_code text,
  cuisine      text,
  spend        numeric(10,2) not null default 0 check (spend >= 0),
  servings     smallint      not null default 2 check (servings between 1 and 12),
  kcal         integer,
  protein      integer,
  carb         integer,
  difficulty   smallint check (difficulty between 1 and 4),
  -- 0 = clean plate, 0.5 = half of it went in the bin
  waste        numeric(3,2)  not null default 0 check (waste >= 0 and waste <= 1),
  cooked_at    timestamptz   not null default now(),
  -- lets the client push the same cook twice without duplicating it
  client_id    text,
  unique (user_id, client_id)
);

create index if not exists cook_log_user_time_idx
  on public.cook_log (user_id, cooked_at desc);

alter table public.cook_log enable row level security;

drop policy if exists "cook log is readable by its owner" on public.cook_log;
create policy "cook log is readable by its owner"
  on public.cook_log for select
  using ((select auth.uid()) = user_id);

drop policy if exists "cook log is insertable by its owner" on public.cook_log;
create policy "cook log is insertable by its owner"
  on public.cook_log for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "cook log is updatable by its owner" on public.cook_log;
create policy "cook log is updatable by its owner"
  on public.cook_log for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "cook log is deletable by its owner" on public.cook_log;
create policy "cook log is deletable by its owner"
  on public.cook_log for delete
  using ((select auth.uid()) = user_id);

-- pantry_items already exists and already carries what the Kitchen screen
-- needs; it was only missing an amount and a use-by, which is what turns
-- "you own this" into "use this first".
alter table public.pantry_items
  add column if not exists amount     text,
  add column if not exists use_by     date,
  add column if not exists perishable boolean not null default false;

alter table public.pantry_items enable row level security;

drop policy if exists "pantry is readable by its owner" on public.pantry_items;
create policy "pantry is readable by its owner"
  on public.pantry_items for select
  using ((select auth.uid()) = user_id);

drop policy if exists "pantry is writable by its owner" on public.pantry_items;
create policy "pantry is writable by its owner"
  on public.pantry_items for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
