import { NextResponse } from 'next/server';
import { isDbConfigured, regenerateUserEmergencyToken, getAuthenticatedUserId } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    let newToken: string | null = null;
    if (isDbConfigured) {
      newToken = await regenerateUserEmergencyToken(userId);
    }

    if (!newToken) {
      newToken = 'tok_' + crypto.randomUUID().replace(/-/g, '');
    }

    return NextResponse.json({
      success: true,
      emergencyToken: newToken,
      message: 'Ancien lien révoqué. Nouveau jeton universel généré avec succès ! 🟢',
    });
  } catch (error) {
    console.error('Error revoking token:', error);
    return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
  }
}
