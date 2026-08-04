'use client';

import { useEffect, useRef } from 'react';
import { useAuthSession } from './useAuthSession';

const POLL_INTERVAL_MS = 20000;
const WARNING_TITLE = 'Toujours Vivant • Check-in requis';
const ALERT_TITLE = 'Toujours Vivant • Alerte déclenchée';

async function showLocalNotification(title: string, body: string) {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url: '/' },
        // `vibrate` is standard on Android/Chrome but missing from TS's DOM lib types.
        ...({ vibrate: [100, 50, 100] } as NotificationOptions),
      });
      return;
    }
  } catch {
    // fall through to the plain Notification API below
  }
  new Notification(title, { body });
}

/**
 * Client-side backup for the pre-alert/alert reminders: polls this device's
 * own check-in status while the app is open and fires a *local* notification
 * (via the service worker, no Web Push / VAPID / server round-trip involved).
 * This is what actually makes reminders reliable today, since the
 * check-alerts cron only runs once a day (see vercel.json) — server push
 * alone can't be trusted to catch the 5-minute warning window.
 *
 * Only fires if the browser Notification permission is already granted
 * (see the Settings toggle, which requests it regardless of whether VAPID
 * push is configured). Never requests permission itself — that must stay a
 * deliberate user action.
 */
export function useLocalCheckinReminder() {
  const { user } = useAuthSession();
  const warnedRef = useRef(false);
  const alertedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    let cancelled = false;

    const poll = async () => {
      if (Notification.permission !== 'granted') return;

      try {
        const res = await fetch('/api/ping');
        const data = await res.json();
        if (cancelled || !data.authenticated) return;

        if (data.status === 'WARNING') {
          if (!warnedRef.current) {
            warnedRef.current = true;
            const minutes = Math.max(1, Math.round((data.secondsRemaining || 0) / 60));
            await showLocalNotification(
              WARNING_TITLE,
              `Il vous reste environ ${minutes} min avant le déclenchement de l'alerte à vos proches.`
            );
          }
        } else if (data.status === 'ALERT') {
          if (!alertedRef.current) {
            alertedRef.current = true;
            await showLocalNotification(
              ALERT_TITLE,
              "Aucun check-in détecté à temps. Faites un check-in dès que possible pour rassurer vos proches."
            );
          }
        } else {
          warnedRef.current = false;
          alertedRef.current = false;
        }
      } catch {
        // Transient network error — try again on the next tick.
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id]);
}
