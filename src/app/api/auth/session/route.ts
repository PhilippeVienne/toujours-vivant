import { NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/session';
import { fetchUserProfile } from '@/lib/db';

export async function GET() {
  const userId = await verifySessionCookie();
  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const profile = await fetchUserProfile(userId);
  if (!profile) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      user_metadata: {
        full_name: profile.fullName,
        avatar_url: profile.avatarUrl,
      },
    },
  });
}
