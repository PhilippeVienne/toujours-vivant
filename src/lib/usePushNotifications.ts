'use client';

import { useCallback, useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export type PushSupportState = 'unsupported' | 'unconfigured' | 'ready';

/**
 * Manages the browser's Web Push subscription lifecycle: permission request,
 * subscribing via the service worker, and syncing the subscription with the
 * backend (`/api/push/subscribe`) so cron-triggered reminders/alerts can reach
 * this device.
 */
export function usePushNotifications() {
  const [supportState, setSupportState] = useState<PushSupportState>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
    const state: PushSupportState = !supported ? 'unsupported' : !VAPID_PUBLIC_KEY ? 'unconfigured' : 'ready';

    queueMicrotask(() => setSupportState(state));
    if (state !== 'ready') return;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => setSubscribed(false));
  }, []);

  const subscribe = useCallback(async () => {
    if (supportState !== 'ready') return false;
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

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
  }, [supportState]);

  const unsubscribe = useCallback(async () => {
    if (supportState !== 'ready') return false;
    setLoading(true);
    try {
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
  }, [supportState]);

  return { supportState, subscribed, loading, subscribe, unsubscribe };
}
