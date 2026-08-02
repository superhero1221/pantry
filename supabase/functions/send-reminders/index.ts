// Pantry — deliver due reminders as Web Push.
//
// Called by pg_cron every five minutes (see the schedule_reminders migration).
// Reads reminders whose due_at has passed, pushes them to every live
// subscription the user has, and marks them sent. Subscriptions the browser
// reports as gone (404/410) are retired rather than retried forever.
//
// Secrets it needs:
//   VAPID_PUBLIC_KEY   — same value the client subscribes with
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT      — a mailto: or https: contact, required by the spec
//
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com

import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@pantry.app';

webpush.setVapidDetails(subject, publicKey, privateKey);

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

type Reminder = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  lang: string;
  url: string | null;
};

type Subscription = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

Deno.serve(async () => {
  const { data: due, error } = await db
    .from('reminders')
    .select('id, user_id, title, body, lang, url')
    .is('sent_at', null)
    .is('failed_at', null)
    .lte('due_at', new Date().toISOString())
    .limit(200)
    .returns<Reminder[]>();

  if (error) {
    console.error('reading reminders', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!due?.length) {
    return Response.json({ sent: 0, failed: 0 });
  }

  const userIds = [...new Set(due.map((r) => r.user_id))];
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)
    .is('expired_at', null)
    .returns<Subscription[]>();

  const byUser = new Map<string, Subscription[]>();
  for (const s of subs ?? []) {
    const list = byUser.get(s.user_id) ?? [];
    list.push(s);
    byUser.set(s.user_id, list);
  }

  const gone: string[] = [];
  const sent: string[] = [];
  const failed: string[] = [];

  for (const reminder of due) {
    const targets = byUser.get(reminder.user_id) ?? [];
    if (!targets.length) {
      // Nothing to push to — mark it failed rather than leaving it due
      // forever, so the queue does not grow without bound.
      failed.push(reminder.id);
      continue;
    }

    const payload = JSON.stringify({
      title: reminder.title,
      body: reminder.body,
      lang: reminder.lang,
      url: reminder.url ?? '/',
      tag: 'pantry-' + reminder.id,
    });

    const results = await Promise.allSettled(
      targets.map((t) =>
        webpush.sendNotification(
          { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
          payload,
        ),
      ),
    );

    let delivered = false;
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        delivered = true;
        return;
      }
      const status = (result.reason as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) gone.push(targets[i].id);
      else console.error('push failed', status, result.reason);
    });

    (delivered ? sent : failed).push(reminder.id);
  }

  const now = new Date().toISOString();
  if (sent.length) await db.from('reminders').update({ sent_at: now }).in('id', sent);
  if (failed.length) await db.from('reminders').update({ failed_at: now }).in('id', failed);
  if (gone.length) {
    await db.from('push_subscriptions').update({ expired_at: now }).in('id', gone);
  }

  return Response.json({ sent: sent.length, failed: failed.length, retired: gone.length });
});
