-- Pantry: run the reminder sender every five minutes.
--
-- Apply this one LAST, and only after:
--   1. the send-reminders edge function is deployed, and
--   2. these two settings exist (they are read from Vault, never inlined):
--        select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--        select vault.create_secret('<service_role_key>', 'service_role_key');
--
-- pg_cron and pg_net both need enabling on the project first — Dashboard →
-- Database → Extensions, or the two create statements below if your role can.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net  with schema extensions;

create or replace function public.dispatch_due_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  key  text;
begin
  select decrypted_secret into base
    from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into key
    from vault.decrypted_secrets where name = 'service_role_key';

  if base is null or key is null then
    raise notice 'dispatch_due_reminders: vault secrets missing, nothing sent';
    return;
  end if;

  -- Only knock on the door if there is something to deliver.
  if not exists (
    select 1 from public.reminders
    where sent_at is null and failed_at is null and due_at <= now()
  ) then
    return;
  end if;

  perform extensions.http_post(
    url     := base || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'Authorization', 'Bearer ' || key
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
end;
$$;

revoke all on function public.dispatch_due_reminders() from public, anon, authenticated;

select cron.unschedule('pantry-send-reminders')
where exists (select 1 from cron.job where jobname = 'pantry-send-reminders');

select cron.schedule(
  'pantry-send-reminders',
  '*/5 * * * *',
  $$ select public.dispatch_due_reminders(); $$
);
