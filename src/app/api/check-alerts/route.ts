import { NextResponse } from 'next/server';
import { sendEmergencyAlertEmail } from '@/lib/resend';
import { isSupabaseConfigured, supabase, supabaseAdmin } from '@/lib/supabase';
import { computeRealtimeUserStatus } from '@/lib/checkInStatus';
import { sendPushToUser } from '@/lib/webpush';
import { redis } from '@/lib/redis';

export async function GET(request: Request) {
  return handleCheckAlerts(request);
}

export async function POST(request: Request) {
  return handleCheckAlerts(request);
}

async function handleCheckAlerts(request: Request) {
  try {
    // 1. Security check for cron secret authorization header if CRON_SECRET is configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized Cron Request' }, { status: 401 });
      }
    }

    const client = supabaseAdmin || supabase;
    let alertsProcessedCount = 0;
    const alertDetails: any[] = [];

    // 2. Query all registered users from Supabase DB
    if (isSupabaseConfigured && client) {
      const { data: users, error } = await client.from('users').select('*');

      if (!error && users && users.length > 0) {
        const appHost = request.headers.get('host') || 'toujours-vivant.fr';
        const protocol = appHost.includes('localhost') ? 'http' : 'https';

        for (const u of users) {
          const pingFreq = u.ping_frequency_minutes || 720;

          // Respects "hors réseau" pauses: stays PAUSED while offline_until is in
          // the future, and resumes the countdown from offline_until (not the
          // stale last ping) once it passes, so returning travelers get a full
          // grace window instead of an immediate alert.
          const { status: realtimeStatus } = computeRealtimeUserStatus({
            lastPingAt: u.last_ping_at,
            pingFrequencyMinutes: pingFreq,
            status: u.status,
            offlineUntil: u.offline_until,
          });

          const isExpired = realtimeStatus === 'ALERT';

          // Pre-alert push reminder sent once per warning window (deduped via
          // Redis so repeated cron ticks don't spam the device); cleared on the
          // next successful ping (see /api/ping) so it can fire again later.
          if (realtimeStatus === 'WARNING') {
            const warnedKey = `user:${u.id}:warned`;
            const alreadyWarned = redis ? await redis.get(warnedKey) : false;
            if (!alreadyWarned) {
              await sendPushToUser(u.id, {
                title: 'Toujours Vivant • Check-in requis',
                body: 'Il vous reste moins de 5 minutes avant le déclenchement de l\'alerte à vos proches.',
              });
              if (redis) await redis.set(warnedKey, '1', { ex: pingFreq * 60 });
            }
          }

          if (isExpired && u.status !== 'ALERT') {
            // Fetch user's emergency contacts who opted for email notifications
            const { data: contacts } = await client
              .from('emergency_contacts')
              .select('*')
              .eq('user_id', u.id)
              .eq('notify_by_email', true);

            const recipientEmails = (contacts || [])
              .map((c: any) => c.email)
              .filter((e: string | null): e is string => Boolean(e && e.includes('@')));

            let emailResult = null;
            if (recipientEmails.length > 0) {
              const statusUrl = `${protocol}://${appHost}/status/${u.emergency_token || u.id}`;

              emailResult = await sendEmergencyAlertEmail({
                toEmails: recipientEmails,
                userName: u.full_name || u.email?.split('@')[0] || 'Utilisateur',
                lastPingAt: u.last_ping_at,
                statusUrl,
              });

              // Log alert entry in database
              await client.from('alert_logs').insert({
                user_id: u.id,
                trigger_reason: `CHECKIN_EXPIRED_${pingFreq}M`,
                sent_to_emails: recipientEmails,
                status: emailResult.success ? 'SENT' : 'FAILED',
              });
            }

            // Notify the user's own devices that the alert fired (they may still be
            // able to check in and abort it before the recipients act on it).
            await sendPushToUser(u.id, {
              title: 'Toujours Vivant • Alerte déclenchée',
              body: 'Aucun check-in détecté : vos proches viennent d\'être notifiés. Faites un check-in dès que possible.',
            });

            // Update user status to ALERT in database (clears any stale offline pause)
            await client.from('users').update({ status: 'ALERT', offline_until: null }).eq('id', u.id);
            alertsProcessedCount++;
            alertDetails.push({ userId: u.id, recipientEmails, emailResult });
          }
        }
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      alertsProcessedCount,
      alertDetails,
      success: true,
    });
  } catch (error) {
    console.error('Error in /api/check-alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
