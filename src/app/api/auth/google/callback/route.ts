import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForIdentity } from '@/lib/googleOAuth';
import { findOrCreateUserFromGoogle } from '@/lib/db';
import { createSessionCookie } from '@/lib/session';

function getRedirectUri(request: Request): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/api/auth/google/callback`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const origin = url.origin;

  const cookieStore = await cookies();
  const expectedState = cookieStore.get('oauth_state')?.value;
  cookieStore.delete('oauth_state');

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/?auth_error=invalid_state`);
  }

  try {
    const identity = await exchangeCodeForIdentity(code, getRedirectUri(request));
    const userId = await findOrCreateUserFromGoogle(identity);

    if (!userId) {
      return NextResponse.redirect(`${origin}/?auth_error=db_not_configured`);
    }

    await createSessionCookie(userId);
    return NextResponse.redirect(origin);
  } catch (error) {
    console.error('Erreur callback Google OAuth:', error);
    return NextResponse.redirect(`${origin}/?auth_error=oauth_failed`);
  }
}
