import { NextResponse } from 'next/server';
import { setUserCheckInTimer, getUserCheckInTimer } from '@/lib/redis';
import { isSupabaseConfigured, fetchUserProfile, fetchUserContacts, fetchUserPings, recordUserPing, getAuthenticatedUserId } from '@/lib/supabase';
import { computeRealtimeUserStatus } from '@/lib/checkInStatus';
import { formatDurationMinutes } from '@/lib/formatTime';
import { PingType } from '@/types';

export async function POST(request: Request) {
  try {
    const reqUserId = await getAuthenticatedUserId(request);

    if (!reqUserId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { latitude, longitude, locationName, message, pingType } = body;

    const actualPingType: PingType = pingType || 'MANUAL';

    // 1. Fetch user's custom ping frequency (default 720 min / 12h, twice-daily check-in)
    let pingFrequencyMinutes = 720;
    if (isSupabaseConfigured) {
      const userProfile = await fetchUserProfile(reqUserId);
      if (userProfile?.pingFrequencyMinutes) {
        pingFrequencyMinutes = userProfile.pingFrequencyMinutes;
      }
    }

    const ttlSeconds = pingFrequencyMinutes * 60;

    // 2. Set Upstash Redis timer key
    await setUserCheckInTimer(reqUserId, ttlSeconds);

    // 3. Save Ping in database
    let pingLog = null;
    if (isSupabaseConfigured) {
      pingLog = await recordUserPing(reqUserId, actualPingType, locationName, latitude, longitude, message);
    }

    return NextResponse.json({
      success: true,
      message: `Ping enregistré avec succès. Prochain check-in dans ${formatDurationMinutes(pingFrequencyMinutes)}. 🟢`,
      ping: pingLog,
      status: 'OK',
      secondsRemaining: ttlSeconds,
      lastPingAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/ping:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const reqUserId = await getAuthenticatedUserId(request);

    if (!reqUserId) {
      return NextResponse.json({
        authenticated: false,
        status: 'OK',
        secondsRemaining: 43200,
        user: null,
        contacts: [],
        latestPings: []
      });
    }

    const { active, warning } = await getUserCheckInTimer(reqUserId);

    let user: any = null;
    let contacts: any[] = [];
    let latestPings: any[] = [];

    if (isSupabaseConfigured) {
      const dbUser = await fetchUserProfile(reqUserId);
      if (dbUser) {
        user = dbUser;
        contacts = await fetchUserContacts(reqUserId);
        latestPings = await fetchUserPings(reqUserId);
      }
    }

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        status: 'OK',
        secondsRemaining: 43200,
        user: null,
        contacts: [],
        latestPings: []
      });
    }

    // Compute realtime status & exact remaining seconds from lastPingAt
    const { status, secondsRemaining } = computeRealtimeUserStatus(user);

    return NextResponse.json({
      authenticated: true,
      status,
      secondsRemaining,
      redisState: { active, warning },
      user: {
        ...user,
        status,
      },
      contacts,
      latestPings
    });
  } catch (error) {
    console.error('Error in GET /api/ping:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
