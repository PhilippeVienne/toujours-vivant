'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { getUserSession, onAuthStateChange } from '@/lib/supabase';

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // Check session on mount
    getUserSession().then((u) => {
      if (isMounted) {
        setUser(u);
        setLoading(false);
      }
    });

    // Subscribe to auth state changes (e.g. INITIAL_SESSION, SIGNED_IN, SIGNED_OUT)
    const unsubscribe = onAuthStateChange((u) => {
      if (isMounted) {
        setUser(u);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { user, loading, setUser };
}
