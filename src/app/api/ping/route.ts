import { NextResponse } from 'next/server';
import { setUserCheckInTimer, getUserCheckInTimer } from '@/lib/redis';
import { isSupabaseConfigured, fetchUserProfile, fetchUserContacts, fetchUserPings, recordUserPing } from '@/lib/supabase';
import { PingType, UserStatus } from '@/types';

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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { latitude, longitude, locationName, message, pingType, userId: reqUserId } = body;

    if (!reqUserId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const actualPingType: PingType = pingType || 'MANUAL';

    // 1. Fetch user's custom ping frequency (default 30 min)
    let pingFrequencyMinutes = 30;
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
      message: `Ping enregistré avec succès. Timer réinitialisé à ${pingFrequencyMinutes} minutes. 🟢`,
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
    const { searchParams } = new URL(request.url);
    const reqUserId = searchParams.get('userId');

    if (!reqUserId) {
      return NextResponse.json({
        authenticated: false,
        status: 'OK',
        secondsRemaining: 1800,
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
        secondsRemaining: 1800,
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
