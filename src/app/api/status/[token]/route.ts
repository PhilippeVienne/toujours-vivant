import { NextResponse } from 'next/server';
import { isSupabaseConfigured, fetchUserByToken, fetchContactByIdOrToken, fetchUserPings } from '@/lib/supabase';
import { UserStatus } from '@/types';

function computeRealtimeUserStatus(user: { lastPingAt?: string; pingFrequencyMinutes?: number; status?: UserStatus }) {
  const customMinutes = user.pingFrequencyMinutes || 30;
  const totalAllowedSeconds = customMinutes * 60;

  if (!user.lastPingAt) {
    return {
      status: 'OK' as UserStatus,
      secondsRemaining: totalAllowedSeconds,
      elapsedSeconds: 0,
    };
  }

  const lastPingMs = new Date(user.lastPingAt).getTime();
  const nowMs = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - lastPingMs) / 1000));
  const secondsRemaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

  let status: UserStatus = 'OK';
  if (secondsRemaining <= 0) {
    status = 'ALERT';
  } else if (secondsRemaining <= 300) {
    status = 'WARNING';
  }

  return {
    status,
    secondsRemaining,
    elapsedSeconds,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 3) {
    return NextResponse.json({ error: 'Jeton de consultation invalide.' }, { status: 404 });
  }

  if (isSupabaseConfigured) {
    // 1. First check if token is a Contact UUID or Contact Token
    const contactResult = await fetchContactByIdOrToken(token);
    if (contactResult) {
      const { contact, user } = contactResult;
      const { status, secondsRemaining } = computeRealtimeUserStatus(user);
      const userPings = await fetchUserPings(user.id);

      return NextResponse.json({
        valid: true,
        isContactView: true,
        contactName: contact.name,
        user: {
          fullName: user.fullName,
          status,
          lastPingAt: user.lastPingAt,
          pingFrequencyMinutes: user.pingFrequencyMinutes
        },
        secondsRemaining,
        latestPing: userPings[0] || null,
        recentPings: userPings.slice(0, 5)
      });
    }

    // 2. Otherwise check if token is a User Emergency Token
    const dbUser = await fetchUserByToken(token);
    if (dbUser) {
      const { status, secondsRemaining } = computeRealtimeUserStatus(dbUser);
      const userPings = await fetchUserPings(dbUser.id);

      return NextResponse.json({
        valid: true,
        isContactView: false,
        user: {
          fullName: dbUser.fullName,
          status,
          lastPingAt: dbUser.lastPingAt,
          pingFrequencyMinutes: dbUser.pingFrequencyMinutes
        },
        secondsRemaining,
        latestPing: userPings[0] || null,
      });
    }
  }

  return NextResponse.json({ error: 'Jeton de consultation invalide ou expiré.' }, { status: 404 });
}
