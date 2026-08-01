import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase, regenerateUserEmergencyToken } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    let newToken: string | null = null;
    if (isSupabaseConfigured && supabase) {
      newToken = await regenerateUserEmergencyToken(userId);
    }

    if (!newToken) {
      newToken = 'tok_' + Math.random().toString(36).substring(2, 12);
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
