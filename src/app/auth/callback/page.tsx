'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        router.replace('/?auth_error=supabase_not_configured');
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          // Attempt code exchange. If verifier is missing (e.g. from an earlier flow before code update),
          // don't abort immediately—continue to check getSession() / onAuthStateChange.
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn('PKCE code exchange notice:', error.message);
          }
        }

        // 1. Check if session is already established
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/');
          return;
        }

        // 2. Listen for state changes (e.g. implicit hash parsing or async session update)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            subscription.unsubscribe();
            router.replace('/');
          }
        });

        // 3. Fallback timeout to check session once more before redirecting
        const timeout = setTimeout(async () => {
          subscription.unsubscribe();
          const sessionRes = supabase ? await supabase.auth.getSession() : null;
          if (sessionRes?.data?.session) {
            router.replace('/');
          } else {
            router.replace('/');
          }
        }, 2500);

        return () => clearTimeout(timeout);
      } catch (err: any) {
        console.error('Auth callback exception:', err);
        router.replace('/');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4 text-slate-200">
      <div className="flex flex-col items-center gap-4 bg-slate-900/80 border border-slate-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-xl">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm font-medium">Finalisation de la connexion Google...</p>
        {errorMsg && <p className="text-xs text-rose-400 mt-2">{errorMsg}</p>}
      </div>
    </div>
  );
}
