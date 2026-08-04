import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days

const secretValue = process.env.SESSION_SECRET;
const encodedSecret = secretValue ? new TextEncoder().encode(secretValue) : null;

export const isSessionConfigured = Boolean(encodedSecret);

/**
 * Signs a minimal JWT (just the user id) and sets it as an httpOnly session
 * cookie. Kept intentionally free of PII per Next.js's session guidance —
 * anything else needed is re-fetched from the DB on each request.
 */
export async function createSessionCookie(userId: string) {
  if (!encodedSecret) throw new Error('SESSION_SECRET n\'est pas configuré.');

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(encodedSecret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
}

/**
 * Reads and verifies the session cookie, returning the authenticated user id
 * or null. Used by every API route as the single source of truth for "who is
 * making this request" (replaces Supabase Auth's Bearer-token verification).
 */
export async function verifySessionCookie(): Promise<string | null> {
  if (!encodedSecret) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ['HS256'] });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
