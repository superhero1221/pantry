-- How much cooking you have done: one number, 1 to 4.
--
-- This replaces the two tier-list maps the old onboarding wrote. skill_cards
-- and time_cards stay in the table, unwritten from now on: they are NOT NULL
-- DEFAULT '{}' (20260802120000_profile_state.sql), so leaving them alone costs
-- nothing, and an older client still cached in somebody's service worker can
-- carry on writing them without erroring.
--
-- profiles.skill is NOT this column. That belongs to the old pantry-globe
-- build, which still upserts it, and its constraints are not versioned in this
-- repo. pushProfile only console.warns on failure, so a single violation of a
-- constraint we cannot see would silently stop every other column syncing for
-- that account, permanently. Hence a new column rather than reusing it.

alter table public.profiles
  add column if not exists skill_level smallint;

alter table public.profiles
  drop constraint if exists profiles_skill_level_check;
alter table public.profiles
  add constraint profiles_skill_level_check
  check (skill_level is null or skill_level between 1 and 4);

-- The client's levelFromCards(), in SQL, so that somebody who answered the old
-- drag-and-drop screen and then signs in on a new phone gets the level they
-- already earned rather than the default. Weights are SKILL_CARDS' own: S
-- counts at 1.1, A at 0.7, B and C at nothing, total over four.
create or replace function public.pantry_level_from_cards(cards jsonb)
returns smallint
language sql
immutable
as $$
  select case
    when cards is null or cards = '{}'::jsonb then null
    else greatest(1, least(4, round(
      (select coalesce(sum(
         case cards->>w.id when 'S' then w.wt * 1.1 when 'A' then w.wt * 0.7 else 0 end
       ), 0) from (values
         ('onion', 1), ('rice', 1), ('sear', 2), ('sauce', 2),
         ('temp', 2), ('fry', 3), ('dough', 3), ('fish', 4)
       ) as w(id, wt)) / 4.0
    )))::smallint
  end;
$$;

update public.profiles
   set skill_level = public.pantry_level_from_cards(skill_cards)
 where skill_level is null
   and skill_cards is not null
   and skill_cards <> '{}'::jsonb;
