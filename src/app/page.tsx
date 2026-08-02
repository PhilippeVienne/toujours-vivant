'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { ManualPingButton } from '@/components/ManualPingButton';
import { StatusTimeline } from '@/components/StatusTimeline';
import { CheckInStatusResponse } from '@/types';
import { signInWithGoogle, getAuthHeaders } from '@/lib/supabase';
import { useAuthSession } from '@/lib/useAuthSession';
import { ShieldCheck, Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthSession();
  const [data, setData] = useState<CheckInStatusResponse | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ping', { headers: await getAuthHeaders() });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching dashboard status:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchStatus();
      const interval = setInterval(() => {
        fetchStatus();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchStatus]);

  const handleLogin = async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Login error:', err);
      setSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-sm font-medium text-slate-400">Chargement de votre espace sécurisé...</p>
      </div>
    );
  }

  // UNAUTHENTICATED LANDING VIEW
  if (!user) {
    return (
      <div className="space-y-12 animate-fade-in max-w-5xl mx-auto py-4">
        {/* Hero Section */}
        <div className="relative overflow-hidden p-8 md:p-12 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Système de sécurité & Check-in quotidien</span>
          </div>

          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Toujours Vivant <span className="text-emerald-400">.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              La solution automatique pour rassurer vos proches. Signalez votre présence en 1 tap ou laissez l'accéléromètre réinitialiser votre chrono. En cas de silence prolongé, vos proches reçoivent une alerte d'urgence.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={handleLogin}
              disabled={signingIn}
              className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {signingIn ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Se connecter avec Google</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Check-in 1-Tap & Passif</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Un simple appui sur le bouton réinitialise votre chronomètre de sécurité. L'application prend également en compte les mouvements de votre smartphone.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Alertes Proches Automatiques</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Si votre chronomètre s'épuise, vos contacts d'urgence reçoivent automatiquement un e-mail d'alerte contenant votre position et l'heure de votre dernier signalement.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sécurité & Confidentialité Strictes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vos données personnelles, contacts et positions sont totalement privés et isolés par authentification forte. Seuls vos contacts autorisés peuvent voir votre statut.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD VIEW
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Top Status & Timer Badge */}
      <StatusBadge
        initialStatus={data?.status || 'OK'}
        initialSecondsRemaining={data?.secondsRemaining ?? 1800}
        onRefresh={() => fetchStatus()}
      />

      {/* Main 1-Tap Manual Ping Button */}
      <ManualPingButton onPingSuccess={() => fetchStatus()} userId={user.id} />

      {/* Bottom Timeline */}
      {data?.latestPings && data.latestPings.length > 0 && (
        <StatusTimeline pings={data.latestPings} />
      )}

    </div>
  );
}
