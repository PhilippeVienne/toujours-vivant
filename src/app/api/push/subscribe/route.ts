import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, saveUserPushSubscription, deleteUserPushSubscription } from '@/lib/supabase';

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subscription = body?.subscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: 'Abonnement push invalide' }, { status: 400 });
  }

  const saved = await saveUserPushSubscription(userId, subscription, request.headers.get('user-agent') || undefined);
  if (!saved) {
    return NextResponse.json({ error: "Échec de l'enregistrement de l'abonnement" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint manquant' }, { status: 400 });
  }

  await deleteUserPushSubscription(userId, endpoint);
  return NextResponse.json({ success: true });
}
