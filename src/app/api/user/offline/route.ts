import { NextResponse } from 'next/server';
import { isDbConfigured, fetchUserProfile, updateUserOfflineStatus, getAuthenticatedUserId } from '@/lib/db';
import { setUserCheckInTimer } from '@/lib/redis';

// Activates "hors réseau" mode: alerts are suspended until the chosen duration elapses.
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const durationHours = Number(body.durationHours);

    if (!durationHours || isNaN(durationHours) || durationHours < 1 || durationHours > 720) {
      return NextResponse.json({ error: 'Durée invalide (entre 1 heure et 30 jours).' }, { status: 400 });
    }

    const offlineUntil = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();

    if (isDbConfigured) {
      const updated = await updateUserOfflineStatus(userId, offlineUntil);
      if (!updated) {
        return NextResponse.json({ error: 'Erreur lors de l\'activation du mode hors-réseau.' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      offlineUntil,
      message: `Mode hors-réseau activé jusqu'au ${new Date(offlineUntil).toLocaleString('fr-FR')}. Vos proches ne recevront pas d'alerte pendant ce temps.`,
    });
  } catch (error) {
    console.error('Error in POST /api/user/offline:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// "Je suis de retour" — resumes normal monitoring immediately with a fresh window.
export async function DELETE(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    let pingFrequencyMinutes = 720;

    if (isDbConfigured) {
      const updated = await updateUserOfflineStatus(userId, null);
      if (!updated) {
        return NextResponse.json({ error: 'Erreur lors de la réactivation.' }, { status: 500 });
      }
      const profile = await fetchUserProfile(userId);
      if (profile?.pingFrequencyMinutes) {
        pingFrequencyMinutes = profile.pingFrequencyMinutes;
      }
    }

    await setUserCheckInTimer(userId, pingFrequencyMinutes * 60);

    return NextResponse.json({ success: true, message: 'Bon retour ! Le suivi normal a repris.' });
  } catch (error) {
    console.error('Error in DELETE /api/user/offline:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
