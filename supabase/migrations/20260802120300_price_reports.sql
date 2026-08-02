-- Pantry: real prices, contributed by the people standing in the shop.
--
-- The design is honest that most of its basket is modelled rather than
-- measured. This is the path from modelled to measured: anyone signed in can
-- log what an ingredient actually cost, and everyone sees the median.
--
-- Reads go through a security-definer function that returns aggregates only.
-- A plain select policy over price_reports would expose who reported what,
-- and where they shop is not a thing this app should hand out.

alter table public.price_reports
  add column if not exists store_tier text
    check (store_tier is null or store_tier in
           ('discount', 'standard', 'convenience', 'premium', 'wholesale'));

create index if not exists price_reports_ref_country_idx
  on public.price_reports (ref, country, created_at desc);

alter table public.price_reports enable row level security;

drop policy if exists "price reports are insertable by signed-in users" on public.price_reports;
create policy "price reports are insertable by signed-in users"
  on public.price_reports for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "you can see your own price reports" on public.price_reports;
create policy "you can see your own price reports"
  on public.price_reports for select
  using ((select auth.uid()) = user_id);

drop policy if exists "you can delete your own price reports" on public.price_reports;
create policy "you can delete your own price reports"
  on public.price_reports for delete
  using ((select auth.uid()) = user_id);

-- Median price per kilo for a basket of ingredients, in one round trip.
-- Aggregates only: no user_id, no store name, nothing that identifies a
-- contributor. Six months is the window — older than that and a grocery price
-- is a historical curiosity rather than a number to shop against.
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
    and r.pack_grams > 0
    and r.created_at > now() - interval '180 days'
  group by r.ref;
$$;

revoke all on function public.price_medians(text[], text) from public;
grant execute on function public.price_medians(text[], text) to anon, authenticated;

comment on function public.price_medians(text[], text) is
  'Community median price per kg for each ingredient. Aggregates only — never exposes who reported a price or where they shop.';
