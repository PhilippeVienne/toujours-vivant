import 'server-only';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const isGoogleOAuthConfigured = Boolean(clientId && clientSecret);

const googleJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export interface GoogleIdentity {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', clientId!);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

/**
 * Exchanges the authorization code for Google's ID token and verifies it
 * against Google's published JWKS. The ID token alone carries everything we
 * need (sub/email/name/picture) — no separate userinfo call, and no Google
 * access/refresh token is kept since we only need identity, not API access.
 */
export async function exchangeCodeForIdentity(code: string, redirectUri: string): Promise<GoogleIdentity> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Échec de l'échange du code Google OAuth: ${await tokenRes.text()}`);
  }

  const { id_token: idToken } = await tokenRes.json();
  if (!idToken) throw new Error('Aucun id_token reçu de Google.');

  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: clientId,
  });

  if (!payload.sub || !payload.email) {
    throw new Error('id_token Google incomplet (sub/email manquant).');
  }

  return {
    sub: payload.sub,
    email: payload.email as string,
    name: payload.name as string | undefined,
    picture: payload.picture as string | undefined,
  };
}
