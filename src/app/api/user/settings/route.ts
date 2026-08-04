import { NextResponse } from 'next/server';
import { isDbConfigured, fetchUserProfile, updateUserPingFrequency, getAuthenticatedUserId } from '@/lib/db';
import { setUserCheckInTimer } from '@/lib/redis';
import { formatDurationMinutes } from '@/lib/formatTime';

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
  }

  if (isDbConfigured) {
    const user = await fetchUserProfile(userId);
    if (user) {
      return NextResponse.json({
        pingFrequencyMinutes: user.pingFrequencyMinutes || 720,
      });
    }
  }

  return NextResponse.json({ pingFrequencyMinutes: 720 });
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { pingFrequencyMinutes } = body;

    const minutes = Number(pingFrequencyMinutes);
    if (isNaN(minutes) || minutes < 5 || minutes > 1440) {
      return NextResponse.json({ error: 'Le délai doit être compris entre 5 et 1440 minutes.' }, { status: 400 });
    }

    if (isDbConfigured) {
      const updated = await updateUserPingFrequency(userId, minutes);
      if (!updated) {
        return NextResponse.json({ error: 'Erreur lors de la mise à jour des paramètres.' }, { status: 500 });
      }
    }

    // Reset Redis timer TTL to the new custom duration
    await setUserCheckInTimer(userId, minutes * 60);

    return NextResponse.json({
      success: true,
      pingFrequencyMinutes: minutes,
      message: `Délai de sécurité mis à jour à ${formatDurationMinutes(minutes)} avec succès.`,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
