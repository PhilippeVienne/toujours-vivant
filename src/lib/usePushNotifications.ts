'use client';

import { useCallback, useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const LOCAL_REMINDERS_KEY = 'tv_local_reminders_enabled';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export type PushSupportState = 'unsupported' | 'ready';

/**
 * Manages notification opt-in for this device. Two independent layers:
 * - Browser `Notification` permission — always requested here; once granted
 *   it powers local, client-side reminders (see useLocalCheckinReminder)
 *   with zero server involvement, so they work even without VAPID configured.
 * - Web Push subscription — only attempted when `pushConfigured` (VAPID keys
 *   present), registered with `/api/push/subscribe` so cron-triggered
 *   reminders/alerts can reach this device even when it isn't open.
 */
export function usePushNotifications() {
  const [supportState, setSupportState] = useState<PushSupportState>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const pushConfigured = Boolean(VAPID_PUBLIC_KEY);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
    const state: PushSupportState = supported ? 'ready' : 'unsupported';

    queueMicrotask(() => setSupportState(state));
    if (state !== 'ready') return;

    if (!pushConfigured) {
      const isSubscribed = Notification.permission === 'granted' && localStorage.getItem(LOCAL_REMINDERS_KEY) === '1';
      queueMicrotask(() => setSubscribed(isSubscribed));
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => setSubscribed(false));
  }, [pushConfigured]);

  const subscribe = useCallback(async () => {
    if (supportState !== 'ready') return false;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      if (!pushConfigured) {
        // No VAPID keys: fall back to local-only reminders (no server round-trip).
        localStorage.setItem(LOCAL_REMINDERS_KEY, '1');
        setSubscribed(true);
        return true;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!res.ok) throw new Error('Échec de l\'enregistrement côté serveur');
      setSubscribed(true);
      return true;
    } catch (err) {
      console.error('Erreur lors de l\'abonnement aux notifications push:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supportState, pushConfigured]);

  const unsubscribe = useCallback(async () => {
    if (supportState !== 'ready') return false;
    setLoading(true);
    try {
      if (!pushConfigured) {
        // The browser Notification permission itself can't be revoked from JS —
        // only the app's own "send reminders" preference can be turned off here.
        localStorage.setItem(LOCAL_REMINDERS_KEY, '0');
        setSubscribed(false);
        return true;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        });
      }
      setSubscribed(false);
      return true;
    } catch (err) {
      console.error('Erreur lors du désabonnement aux notifications push:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supportState, pushConfigured]);

  return { supportState, pushConfigured, subscribed, loading, subscribe, unsubscribe };
}
