import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { buildGoogleAuthUrl, isGoogleOAuthConfigured } from '@/lib/googleOAuth';

function getRedirectUri(request: Request): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/api/auth/google/callback`;
}

export async function GET(request: Request) {
  if (!isGoogleOAuthConfigured) {
    return new NextResponse(
      "OAuth Google non configuré côté serveur : GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont requis.",
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  const authUrl = buildGoogleAuthUrl(getRedirectUri(request), state);
  return NextResponse.redirect(authUrl);
}
