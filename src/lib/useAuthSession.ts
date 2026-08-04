'use client';

import { useState, useEffect } from 'react';

export interface SessionUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string | null;
  };
}

export function useAuthSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setUser(data.user ?? null);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { user, loading, setUser };
}
