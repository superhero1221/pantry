-- Pantry: the leftover nudge, as a real notification.
--
-- "Tomorrow 12:30 — the butter chicken is still good. Reheat it rather than
-- buy lunch." In the prototype that was an in-app toast you could only see if
-- the app was already open, which is exactly when you don't need it. This
-- makes it a Web Push notification that arrives while the app is closed.

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  -- set when a push is rejected as gone, so we stop trying
  expired_at timestamptz
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id) where expired_at is null;

alter table public.push_subscriptions enable row level security;

drop policy if exists "subscriptions are readable by their owner" on public.push_subscriptions;
create policy "subscriptions are readable by their owner"
  on public.push_subscriptions for select
  using ((select auth.uid()) = user_id);

drop policy if exists "subscriptions are writable by their owner" on public.push_subscriptions;
create policy "subscriptions are writable by their owner"
  on public.push_subscriptions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.reminders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null default 'leftover'
             check (kind in ('leftover', 'shop_closing', 'plan')),
  title      text not null,
  body       text not null,
  -- the notification is composed client-side in the user's language, because
  -- the server has no business machine-translating a sentence about prawns
  lang       text not null default 'en',
  url        text,
  due_at     timestamptz not null,
  sent_at    timestamptz,
  failed_at  timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reminders_due_idx
  on public.reminders (due_at) where sent_at is null and failed_at is null;

alter table public.reminders enable row level security;

drop policy if exists "reminders are readable by their owner" on public.reminders;
create policy "reminders are readable by their owner"
  on public.reminders for select
  using ((select auth.uid()) = user_id);

drop policy if exists "reminders are writable by their owner" on public.reminders;
create policy "reminders are writable by their owner"
  on public.reminders for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
