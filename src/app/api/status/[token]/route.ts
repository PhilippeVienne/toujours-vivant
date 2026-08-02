import { NextResponse } from 'next/server';
import { isSupabaseConfigured, fetchUserByToken, fetchContactByIdOrToken, fetchUserPings } from '@/lib/supabase';
import { computeRealtimeUserStatus } from '@/lib/checkInStatus';

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
