import { createClient, User } from '@supabase/supabase-js';
import { UserProfile, EmergencyContact, PingLog } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('example')
);

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey && !supabaseServiceKey.includes('example'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré. Veuillez renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.');
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Erreur de connexion Google Auth:', error);
    throw error;
  }

  return data;
}

export async function signOutUser() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erreur lors de la déconnexion:', error);
    throw error;
  }
}

export async function getUserSession(): Promise<User | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!supabase) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}

// -----------------------------------------------------------------------------
// Client-side helper: attach the current session's access token so API routes
// can verify the caller's identity server-side instead of trusting body/query params.
// -----------------------------------------------------------------------------
export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

// -----------------------------------------------------------------------------
// Server-side helper: verify the caller's Supabase access token (sent via the
// Authorization header) and return the authenticated user's id, or null.
// This must be used instead of trusting a client-supplied userId in API routes.
// -----------------------------------------------------------------------------
export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  if (!supabase) return null;

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user.id;
}

// -----------------------------------------------------------------------------
// Data Helpers for Database Tables (users, emergency_contacts, ping_logs)
// -----------------------------------------------------------------------------

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const client = supabaseAdmin || supabase;
  const fallbackToken = 'tok_' + userId.replace(/-/g, '').substring(0, 12);

  if (!client) {
    return {
      id: userId,
      email: 'user@example.com',
      fullName: 'Utilisateur',
      emergencyToken: fallbackToken,
      pingFrequencyMinutes: 720,
      status: 'OK',
      offlineUntil: null,
      lastPingAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  let { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if ((error || !data) && userId) {
    const { data: newData } = await client
      .from('users')
      .insert({
        id: userId,
        email: 'user@example.com',
        full_name: 'Utilisateur',
        emergency_token: fallbackToken,
      })
      .select()
      .maybeSingle();

    if (newData) data = newData;
  }

  if (!data) return null;

  let emergencyToken = data.emergency_token;
  if (!emergencyToken) {
    emergencyToken = fallbackToken;
    await client.from('users').update({ emergency_token: emergencyToken }).eq('id', userId);
  }

  return {
    id: data.id,
    email: data.email || 'user@example.com',
    fullName: data.full_name || 'Utilisateur',
    emergencyToken,
    pingFrequencyMinutes: data.ping_frequency_minutes || 720,
    status: data.status || 'OK',
    offlineUntil: data.offline_until || null,
    lastPingAt: data.last_ping_at || new Date().toISOString(),
    createdAt: data.created_at || new Date().toISOString(),
  };
}

export async function updateUserPingFrequency(userId: string, minutes: number): Promise<boolean> {
  const client = supabaseAdmin || supabase;
  if (!client) return false;

  const { error } = await client
    .from('users')
    .update({ ping_frequency_minutes: minutes })
    .eq('id', userId);

  if (error) {
    console.error('Erreur lors de la mise à jour du délai de ping:', error);
    return false;
  }

  return true;
}

/**
 * Toggles "hors réseau" mode. Passing an ISO timestamp pauses alerting until
 * that time (status PAUSED); passing null resumes monitoring immediately with
 * a fresh check-in window (status OK, last_ping_at reset to now).
 */
export async function updateUserOfflineStatus(userId: string, offlineUntil: string | null): Promise<boolean> {
  const client = supabaseAdmin || supabase;
  if (!client) return false;

  const updates = offlineUntil
    ? { status: 'PAUSED', offline_until: offlineUntil }
    : { status: 'OK', offline_until: null, last_ping_at: new Date().toISOString() };

  const { error } = await client
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Erreur lors de la mise à jour du statut hors-ligne:', error);
    return false;
  }

  return true;
}

export async function fetchContactByIdOrToken(tokenOrId: string): Promise<{ contact: EmergencyContact; user: UserProfile } | null> {
  const client = supabaseAdmin || supabase;
  if (!client) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenOrId);

  let data: any = null;
  if (isUuid) {
    const { data: resById } = await client
      .from('emergency_contacts')
      .select('*')
      .eq('id', tokenOrId)
      .maybeSingle();
    data = resById;
  }

  if (!data) {
    const { data: resByToken } = await client
      .from('emergency_contacts')
      .select('*')
      .eq('contact_token', tokenOrId)
      .maybeSingle();
    data = resByToken;
  }

  if (!data) return null;

  const user = await fetchUserProfile(data.user_id);
  if (!user) return null;

  return {
    contact: {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      contactToken: data.contact_token || data.id,
      notifyByEmail: data.notify_by_email,
      createdAt: data.created_at,
    },
    user,
  };
}

export async function fetchUserByToken(token: string): Promise<UserProfile | null> {
  const client = supabaseAdmin || supabase;
  if (!client) return null;

  // 1. Check exact match on emergency_token
  const { data: byToken } = await client
    .from('users')
    .select('*')
    .eq('emergency_token', token)
    .maybeSingle();

  if (byToken) {
    return {
      id: byToken.id,
      email: byToken.email,
      fullName: byToken.full_name,
      emergencyToken: byToken.emergency_token,
      pingFrequencyMinutes: byToken.ping_frequency_minutes || 720,
      status: byToken.status || 'OK',
      offlineUntil: byToken.offline_until || null,
      lastPingAt: byToken.last_ping_at,
      createdAt: byToken.created_at,
    };
  }

  // 2. Check if token is UUID (id = token)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  if (isUuid) {
    const { data: byId } = await client
      .from('users')
      .select('*')
      .eq('id', token)
      .maybeSingle();

    if (byId) {
      return {
        id: byId.id,
        email: byId.email,
        fullName: byId.full_name,
        emergencyToken: byId.emergency_token,
        pingFrequencyMinutes: byId.ping_frequency_minutes || 720,
        status: byId.status || 'OK',
        offlineUntil: byId.offline_until || null,
        lastPingAt: byId.last_ping_at,
        createdAt: byId.created_at,
      };
    }
  }

  // 3. Check if token is fallback token format (tok_226b48a590d5)
  if (token.startsWith('tok_')) {
    const cleanHex = token.substring(4);
    if (cleanHex.length >= 8) {
      const { data: allUsers } = await client
        .from('users')
        .select('*')
        .limit(20);

      const matchedUser = (allUsers || []).find(u => u.id.replace(/-/g, '').startsWith(cleanHex));
      if (matchedUser) {
        return {
          id: matchedUser.id,
          email: matchedUser.email,
          fullName: matchedUser.full_name,
          emergencyToken: matchedUser.emergency_token,
          pingFrequencyMinutes: matchedUser.ping_frequency_minutes || 720,
          status: matchedUser.status || 'OK',
          offlineUntil: matchedUser.offline_until || null,
          lastPingAt: matchedUser.last_ping_at,
          createdAt: matchedUser.created_at,
        };
      }
    }
  }

  return null;
}

export async function regenerateUserEmergencyToken(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const newToken = 'tok_' + crypto.randomUUID().replace(/-/g, '');

  const { error } = await supabase
    .from('users')
    .update({ emergency_token: newToken })
    .eq('id', userId);

  if (error) {
    console.error('Erreur lors de la régénération du jeton d\'urgence:', error);
    return null;
  }

  return newToken;
}

export async function fetchUserContacts(userId: string): Promise<EmergencyContact[]> {
  const client = supabaseAdmin || supabase;
  if (!client) return [];

  const { data, error } = await client
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    userId: c.user_id,
    name: c.name,
    email: c.email || '',
    phone: c.phone || '',
    contactToken: c.contact_token || c.id,
    notifyByEmail: c.notify_by_email,
    createdAt: c.created_at,
  }));
}

export async function addUserContact(
  userId: string,
  contact: { name: string; email?: string; phone?: string; notifyByEmail?: boolean }
): Promise<EmergencyContact | null> {
  const client = supabaseAdmin || supabase;
  if (!client) return null;

  const { data, error } = await client
    .from('emergency_contacts')
    .insert({
      user_id: userId,
      name: contact.name,
      email: contact.email || null,
      phone: contact.phone || null,
      notify_by_email: contact.notifyByEmail ?? Boolean(contact.email),
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Erreur lors de l\'ajout du contact:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
    contactToken: data.contact_token || data.id,
    notifyByEmail: data.notify_by_email,
    createdAt: data.created_at,
  };
}

export async function deleteUserContact(contactId: string, userId?: string): Promise<boolean> {
  const client = supabaseAdmin || supabase;
  if (!client) return false;

  let query = client.from('emergency_contacts').delete().eq('id', contactId);
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;
  return !error;
}

export async function recordUserPing(
  userId: string,
  pingType: 'MANUAL' | 'PASSIVE_MOTION' | 'PUSH_CHECKIN',
  locationName?: string,
  latitude?: number,
  longitude?: number,
  message?: string
): Promise<PingLog | null> {
  const client = supabaseAdmin || supabase;
  if (!client) return null;

  const { data, error } = await client
    .from('ping_logs')
    .insert({
      user_id: userId,
      ping_type: pingType,
      location_name: locationName || null,
      latitude: latitude || null,
      longitude: longitude || null,
      message: message || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Erreur lors de l\'enregistrement du ping:', error);
    return null;
  }

  // Update user's last_ping_at & status (a ping always cancels any offline pause)
  await client
    .from('users')
    .update({ last_ping_at: new Date().toISOString(), status: 'OK', offline_until: null })
    .eq('id', userId);

  return {
    id: data.id,
    userId: data.user_id,
    pingType: data.ping_type,
    locationName: data.location_name,
    latitude: data.latitude,
    longitude: data.longitude,
    message: data.message,
    createdAt: data.created_at,
  };
}

export async function fetchUserPings(userId: string): Promise<PingLog[]> {
  const client = supabaseAdmin || supabase;
  if (!client) return [];

  const { data, error } = await client
    .from('ping_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    userId: p.user_id,
    pingType: p.ping_type,
    locationName: p.location_name,
    latitude: p.latitude,
    longitude: p.longitude,
    message: p.message,
    createdAt: p.created_at,
  }));
}
