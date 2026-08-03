import webpush from 'web-push';
import { supabaseAdmin, supabase } from './supabase';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@toujours-vivant.fr';

export const isWebPushConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (isWebPushConfigured) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!);
}

export interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Sends a push notification to every device the user has subscribed from.
 * Subscriptions that the browser has revoked (410/404) are pruned automatically
 * so the table doesn't accumulate dead endpoints.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!isWebPushConfigured) {
    console.log(`[WebPush Mock] "${payload.title}" would be sent to user ${userId}`);
    return { sent: 0, mock: true };
  }

  const client = supabaseAdmin || supabase;
  if (!client) return { sent: 0 };

  const { data: subscriptions } = await client
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subscriptions || subscriptions.length === 0) return { sent: 0 };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
  });

  let sent = 0;
  await Promise.all(
    (subscriptions as PushSubscriptionRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
        sent++;
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        // 404/410 = the browser has unsubscribed or the endpoint expired; drop it.
        if (statusCode === 404 || statusCode === 410) {
          await client.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error(`Erreur d'envoi push (subscription ${sub.id}):`, error);
        }
      }
    })
  );

  return { sent };
}
