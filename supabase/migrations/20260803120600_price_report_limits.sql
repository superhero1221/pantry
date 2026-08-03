-- Pantry: bounds and a rate limit on the one writable public surface.
--
-- The RLS in 20260802120300 is right as far as it goes: a row belongs to the
-- account that wrote it, and reads are aggregates only. What row-level
-- security structurally cannot say is what a plausible row looks like, or how
-- many of them one account may write. Without those, a signed-in client can
-- post a price of 999999, or a pack size of 0.001 g, or ten thousand rows in a
-- minute — and the median every other shopper reads moves.
--
-- This is idempotent and defensive on purpose. price_reports predates the
-- migrations in this repo, so nothing here assumes a prior state.


/* ── created_at belongs to the server ─────────────────────────────────────
   A client that can set its own timestamp can backdate a row out of the
   rate limiter's window, or forward past the 180-day read window. It cannot
   now: the column has a default and the API roles lose the right to write it.
   Column-level revoke rather than a trigger, because it is the smaller thing
   and it fails at the API boundary rather than inside a function. */
alter table public.price_reports
  alter column created_at set default now();

revoke insert (created_at) on public.price_reports from anon, authenticated;


/* ── What a plausible row looks like ──────────────────────────────────────
   NOT VALID on purpose. The table may already hold nonsense from before this
   bound existed, and a migration that fails on legacy data is a migration
   that never lands. NOT VALID still checks every new insert; the historical
   rows are dealt with on the read side, in price_medians below. Run
   `alter table public.price_reports validate constraint price_reports_sane;`
   once you have looked at what is actually in there.

   The numbers: 10000 is high enough for any single pack in any currency the
   app supports, low enough that one fat finger cannot own the median. 50000 g
   is a 50 kg sack. 1 g is the smallest pack anyone has ever bought. */
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'price_reports_sane'
      and conrelid = 'public.price_reports'::regclass
  ) then
    alter table public.price_reports
      add constraint price_reports_sane check (
        price > 0 and price <= 10000
        and pack_grams >= 1 and pack_grams <= 50000
        and currency ~ '^[A-Z]{3}$'
        and (country is null or country ~ '^[A-Z]{2}$')
        and char_length(ref) between 1 and 64
        and (store_name is null or char_length(store_name) <= 80)
      ) not valid;
  end if;
end $$;


/* ── How many one account may write ───────────────────────────────────────
   Three rules, and the third is the one that matters. Twelve an hour and
   forty a day are generous for a person doing a weekly shop and ungenerous
   for a script. One report per ingredient per country per day is the
   difference between crowdsourcing and one person voting a hundred times.

   Each refusal raises a distinct SQLSTATE, because the client has to be able
   to say which one happened in the reader's own language rather than showing
   them an English database string:
     54000  too many, too fast
     23505  already reported this today
     23514  outside the bounds above (raised by the CHECK, not here)

   Honest about the limit of this: it is per account, and an account costs one
   email address. It raises the price of flooding the median from nothing to
   something. It does not make it impossible. */
create index if not exists price_reports_user_recent_idx
  on public.price_reports (user_id, created_at desc);

create or replace function public.price_reports_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  select count(*) into n
    from public.price_reports
    where user_id = new.user_id
      and created_at > now() - interval '1 hour';
  if n >= 12 then
    raise exception 'too many price reports in the last hour'
      using errcode = '54000';
  end if;

  select count(*) into n
    from public.price_reports
    where user_id = new.user_id
      and created_at > now() - interval '24 hours';
  if n >= 40 then
    raise exception 'too many price reports today'
      using errcode = '54000';
  end if;

  select count(*) into n
    from public.price_reports
    where user_id = new.user_id
      and ref = new.ref
      and country is not distinct from new.country
      and created_at > now() - interval '24 hours';
  if n >= 1 then
    raise exception 'this ingredient was already reported today'
      using errcode = '23505';
  end if;

  return new;
end $$;

revoke all on function public.price_reports_rate_limit() from public;

drop trigger if exists price_reports_rate_limit on public.price_reports;
create trigger price_reports_rate_limit
  before insert on public.price_reports
  for each row execute function public.price_reports_rate_limit();


/* ── The read path ────────────────────────────────────────────────────────
   Unchanged except for the bounds. The CHECK above is NOT VALID, so anything
   absurd already in the table is still in the table — this is what stops it
   reaching a screen. Restated in full because that is what `create or
   replace` requires; the grants are re-issued for the same reason. */
create or replace function public.price_medians(refs text[], in_country text default null)
returns table (
  ref            text,
  currency       text,
  median_per_kg  numeric,
  reports        integer,
  newest         timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.ref,
    (array_agg(r.currency order by r.created_at desc))[1] as currency,
    round(
      percentile_cont(0.5) within group (
        order by r.price / (r.pack_grams / 1000.0)
      )::numeric,
      2
    ) as median_per_kg,
    count(*)::integer as reports,
    max(r.created_at) as newest
  from public.price_reports r
  where r.ref = any(refs)
    and (in_country is null or r.country = in_country)
    and r.pack_grams between 1 and 50000
    and r.price > 0 and r.price <= 10000
    and r.created_at > now() - interval '180 days'
  group by r.ref;
$$;

revoke all on function public.price_medians(text[], text) from public;
grant execute on function public.price_medians(text[], text) to anon, authenticated;

comment on function public.price_medians(text[], text) is
  'Community median price per kg for each ingredient. Aggregates only — never exposes who reported a price or where they shop. Rows outside the plausible bounds are excluded on read, because the bound was added after some of them.';