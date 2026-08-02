-- Pantry: the weekly planner.
--
-- saved_plans already exists from the pantry-globe build, but it stored only
-- the parameters a plan was generated from (days, seed, tier) and re-derived
-- the dishes. That means editing a plan is impossible — swap one dish and the
-- seed no longer describes it. plan_meals stores the picks explicitly.

create table if not exists public.plan_meals (
  id        uuid primary key default gen_random_uuid(),
  plan_id   uuid not null references public.saved_plans (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  day       smallint not null check (day between 0 and 13),
  slot      smallint not null default 0 check (slot between 0 and 3),
  recipe_id text not null,
  servings  smallint not null default 2 check (servings between 1 and 12),
  cooked    boolean  not null default false,
  unique (plan_id, day, slot)
);

create index if not exists plan_meals_plan_idx on public.plan_meals (plan_id, day, slot);

alter table public.plan_meals enable row level security;

drop policy if exists "plan meals are readable by their owner" on public.plan_meals;
create policy "plan meals are readable by their owner"
  on public.plan_meals for select
  using ((select auth.uid()) = user_id);

drop policy if exists "plan meals are writable by their owner" on public.plan_meals;
create policy "plan meals are writable by their owner"
  on public.plan_meals for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.saved_plans enable row level security;

drop policy if exists "plans are readable by their owner" on public.saved_plans;
create policy "plans are readable by their owner"
  on public.saved_plans for select
  using ((select auth.uid()) = user_id);

drop policy if exists "plans are writable by their owner" on public.saved_plans;
create policy "plans are writable by their owner"
  on public.saved_plans for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
