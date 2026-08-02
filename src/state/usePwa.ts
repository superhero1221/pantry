import { useCallback, useEffect, useState } from 'react';
import { db, vapidKey } from '../lib/supabase';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const urlBase64ToUint8Array = (base64: string) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

/**
 * Home-screen install and the one notification the app ever sends.
 *
 * Both are opt-in and both are inert without the pieces they need: no install
 * prompt on a browser that does not offer one, and no permission request
 * unless a VAPID key is configured and you are signed in — asking for
 * notification permission you cannot act on is just a popup.
 */
export function usePwa(userId: string | null) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!userId || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, [userId]);

  const install = useCallback(async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  }, [prompt]);

  const enableNudges = useCallback(async () => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted' || !vapidKey || !db || !userId) return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }));

    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
    if (!json.endpoint || !json.keys) return;

    await db.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent.slice(0, 300),
        expired_at: null,
      },
      { onConflict: 'endpoint' },
    );
    setSubscribed(true);
  }, [userId]);

  const canInstall = !!prompt && !installed;
  // iOS offers no install prompt; the Share sheet is the only route, so say so.
  const iosOnly =
    !installed &&
    !prompt &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !/crios|fxios/i.test(navigator.userAgent);

  return {
    canInstall,
    iosOnly,
    installed,
    install,
    permission,
    subscribed,
    enableNudges,
    pushConfigured: !!vapidKey && !!db,
  };
}
