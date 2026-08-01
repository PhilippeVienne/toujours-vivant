import { NextResponse } from 'next/server';
import { isSupabaseConfigured, fetchUserProfile, updateUserPingFrequency } from '@/lib/supabase';
import { setUserCheckInTimer } from '@/lib/redis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
  }

  if (isSupabaseConfigured) {
    const user = await fetchUserProfile(userId);
    if (user) {
      return NextResponse.json({
        pingFrequencyMinutes: user.pingFrequencyMinutes || 30,
      });
    }
  }

  return NextResponse.json({ pingFrequencyMinutes: 30 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, pingFrequencyMinutes } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const minutes = Number(pingFrequencyMinutes);
    if (isNaN(minutes) || minutes < 5 || minutes > 1440) {
      return NextResponse.json({ error: 'Le délai doit être compris entre 5 et 1440 minutes.' }, { status: 400 });
    }

    if (isSupabaseConfigured) {
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
      message: `Délai de sécurité mis à jour à ${minutes} minutes avec succès.`,
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
