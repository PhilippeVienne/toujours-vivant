import postgres, { Row } from 'postgres';
import { UserProfile, EmergencyContact, PingLog } from '@/types';
import { verifySessionCookie } from './session';

const databaseUrl = process.env.DATABASE_URL || '';

export const isDbConfigured = Boolean(databaseUrl && !databaseUrl.includes('example'));

// The local Docker Postgres (docker-compose.yml) speaks plain TCP, no TLS;
// hosted Postgres (Supabase) requires it. Detect from the host rather than
// hardcoding an environment flag, since the same code runs in both contexts.
const isLocalDb = /localhost|127\.0\.0\.1/.test(databaseUrl);

// Single module-scope client; Fluid Compute reuses the function instance across
// requests, so this pool (kept small since Supavisor already pools upstream)
// stays warm instead of reconnecting on every call.
export const sql = isDbConfigured ? postgres(databaseUrl, { max: 3, ssl: isLocalDb ? false : 'require' }) : null;

// -----------------------------------------------------------------------------
// Session — reads the httpOnly cookie set by /api/auth/google/callback.
// Replaces Supabase Auth's Bearer-token verification. The `request` param is
// unused but kept so every existing call site (`getAuthenticatedUserId(request)`)
// didn't need to change.
// -----------------------------------------------------------------------------
export async function getAuthenticatedUserId(_request?: Request): Promise<string | null> {
  return verifySessionCookie();
}

// -----------------------------------------------------------------------------
// Row → domain mappers
// -----------------------------------------------------------------------------

function mapUserRow(row: Row): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url || null,
    emergencyToken: row.emergency_token,
    pingFrequencyMinutes: row.ping_frequency_minutes || 720,
    status: row.status || 'OK',
    offlineUntil: row.offline_until || null,
    lastPingAt: row.last_ping_at,
    createdAt: row.created_at,
  };
}

function mapContactRow(row: Row): EmergencyContact {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    contactToken: row.contact_token || row.id,
    notifyByEmail: row.notify_by_email,
    createdAt: row.created_at,
  };
}

function mapPingRow(row: Row): PingLog {
  return {
    id: row.id,
    userId: row.user_id,
    pingType: row.ping_type,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    message: row.message,
    createdAt: row.created_at,
  };
}

// -----------------------------------------------------------------------------
// Google OAuth login: find the user by google_sub, fall back to matching by
// email (for accounts created before this migration, under the old Supabase
// Auth flow) and backfill google_sub, or create a new row.
// -----------------------------------------------------------------------------
export async function findOrCreateUserFromGoogle(identity: {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}): Promise<string | null> {
  if (!sql) return null;

  const fullName = identity.name || identity.email.split('@')[0];

  const [bySub] = await sql`
    select id from users where google_sub = ${identity.sub} limit 1
  `;
  if (bySub) {
    await sql`
      update users set avatar_url = ${identity.picture || null}, full_name = ${fullName}
      where id = ${bySub.id}
    `;
    return bySub.id;
  }

  const [byEmail] = await sql`
    select id from users where email = ${identity.email} limit 1
  `;
  if (byEmail) {
    await sql`
      update users
      set google_sub = ${identity.sub}, avatar_url = ${identity.picture || null}, full_name = ${fullName}
      where id = ${byEmail.id}
    `;
    return byEmail.id;
  }

  const [created] = await sql`
    insert into users (email, full_name, avatar_url, google_sub)
    values (${identity.email}, ${fullName}, ${identity.picture || null}, ${identity.sub})
    returning id
  `;
  return created?.id ?? null;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!sql) {
    return {
      id: userId,
      email: 'user@example.com',
      fullName: 'Utilisateur',
      avatarUrl: null,
      emergencyToken: 'tok_' + userId.replace(/-/g, '').substring(0, 12),
      pingFrequencyMinutes: 720,
      status: 'OK',
      offlineUntil: null,
      lastPingAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  const [row] = await sql`select * from users where id = ${userId} limit 1`;
  return row ? mapUserRow(row) : null;
}

export async function updateUserPingFrequency(userId: string, minutes: number): Promise<boolean> {
  if (!sql) return false;
  await sql`update users set ping_frequency_minutes = ${minutes} where id = ${userId}`;
  return true;
}

/**
 * Toggles "hors réseau" mode. Passing an ISO timestamp pauses alerting until
 * that time (status PAUSED); passing null resumes monitoring immediately with
 * a fresh check-in window (status OK, last_ping_at reset to now).
 */
export async function updateUserOfflineStatus(userId: string, offlineUntil: string | null): Promise<boolean> {
  if (!sql) return false;

  if (offlineUntil) {
    await sql`update users set status = 'PAUSED', offline_until = ${offlineUntil} where id = ${userId}`;
  } else {
    await sql`
      update users set status = 'OK', offline_until = null, last_ping_at = ${new Date().toISOString()}
      where id = ${userId}
    `;
  }

  return true;
}

export async function fetchContactByIdOrToken(tokenOrId: string): Promise<{ contact: EmergencyContact; user: UserProfile } | null> {
  if (!sql) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenOrId);

  let row: Row | undefined;
  if (isUuid) {
    [row] = await sql`select * from emergency_contacts where id = ${tokenOrId} limit 1`;
  }
  if (!row) {
    [row] = await sql`select * from emergency_contacts where contact_token = ${tokenOrId} limit 1`;
  }
  if (!row) return null;

  const user = await fetchUserProfile(row.user_id);
  if (!user) return null;

  return { contact: mapContactRow(row), user };
}

export async function fetchUserByToken(token: string): Promise<UserProfile | null> {
  if (!sql) return null;

  const [byToken] = await sql`select * from users where emergency_token = ${token} limit 1`;
  if (byToken) return mapUserRow(byToken);

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  if (isUuid) {
    const [byId] = await sql`select * from users where id = ${token} limit 1`;
    if (byId) return mapUserRow(byId);
  }

  if (token.startsWith('tok_')) {
    const cleanHex = token.substring(4);
    if (cleanHex.length >= 8) {
      const rows = await sql`select * from users limit 20`;
      const matched = rows.find((u) => u.id.replace(/-/g, '').startsWith(cleanHex));
      if (matched) return mapUserRow(matched);
    }
  }

  return null;
}

export async function regenerateUserEmergencyToken(userId: string): Promise<string | null> {
  if (!sql) return null;

  const newToken = 'tok_' + crypto.randomUUID().replace(/-/g, '');
  await sql`update users set emergency_token = ${newToken} where id = ${userId}`;
  return newToken;
}

export async function fetchUserContacts(userId: string): Promise<EmergencyContact[]> {
  if (!sql) return [];

  const rows = await sql`
    select * from emergency_contacts where user_id = ${userId} order by created_at desc
  `;
  return rows.map(mapContactRow);
}

export async function addUserContact(
  userId: string,
  contact: { name: string; email?: string; phone?: string; notifyByEmail?: boolean }
): Promise<EmergencyContact | null> {
  if (!sql) return null;

  const [row] = await sql`
    insert into emergency_contacts (user_id, name, email, phone, notify_by_email)
    values (
      ${userId},
      ${contact.name},
      ${contact.email || null},
      ${contact.phone || null},
      ${contact.notifyByEmail ?? Boolean(contact.email)}
    )
    returning *
  `;

  return row ? mapContactRow(row) : null;
}

export async function deleteUserContact(contactId: string, userId?: string): Promise<boolean> {
  if (!sql) return false;

  if (userId) {
    await sql`delete from emergency_contacts where id = ${contactId} and user_id = ${userId}`;
  } else {
    await sql`delete from emergency_contacts where id = ${contactId}`;
  }
  return true;
}

export async function recordUserPing(
  userId: string,
  pingType: 'MANUAL' | 'PASSIVE_MOTION' | 'PUSH_CHECKIN',
  locationName?: string,
  latitude?: number,
  longitude?: number,
  message?: string
): Promise<PingLog | null> {
  if (!sql) return null;

  const [row] = await sql.begin(async (tx) => {
    const [inserted] = await tx`
      insert into ping_logs (user_id, ping_type, location_name, latitude, longitude, message)
      values (${userId}, ${pingType}, ${locationName || null}, ${latitude ?? null}, ${longitude ?? null}, ${message || null})
      returning *
    `;

    await tx`
      update users set last_ping_at = ${new Date().toISOString()}, status = 'OK', offline_until = null
      where id = ${userId}
    `;

    return [inserted];
  });

  return row ? mapPingRow(row) : null;
}

export async function fetchUserPings(userId: string): Promise<PingLog[]> {
  if (!sql) return [];

  const rows = await sql`
    select * from ping_logs where user_id = ${userId} order by created_at desc limit 10
  `;
  return rows.map(mapPingRow);
}

// -----------------------------------------------------------------------------
// Push Notification Subscriptions (Web Push)
// -----------------------------------------------------------------------------

export async function saveUserPushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
): Promise<boolean> {
  if (!sql) return false;

  await sql`
    insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
    values (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, ${userAgent || null})
    on conflict (endpoint) do update
      set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent
  `;
  return true;
}

export async function deleteUserPushSubscription(userId: string, endpoint: string): Promise<boolean> {
  if (!sql) return false;

  await sql`delete from push_subscriptions where user_id = ${userId} and endpoint = ${endpoint}`;
  return true;
}
