'use client';

import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, AlertTriangle, MapPin, Clock, Heart, ExternalLink, RefreshCw, UserCheck } from 'lucide-react';
import { UserStatus, PingLog } from '@/types';

export default function PublicStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const queryContactId = searchParams.get('c') || searchParams.get('contact');

  const [data, setData] = useState<{
    valid: boolean;
    isContactView?: boolean;
    user?: {
      fullName: string;
      status: UserStatus;
      lastPingAt: string;
      pingFrequencyMinutes: number;
    };
    secondsRemaining?: number;
    latestPing?: PingLog | null;
    recentPings?: PingLog[];
    contactName?: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const url = queryContactId ? `/api/status/${token}?c=${encodeURIComponent(queryContactId)}` : `/api/status/${token}`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData({ valid: false, error: 'Impossible de contacter le serveur.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [token, queryContactId]);

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm font-semibold">Chargement du statut sécurisé...</p>
        </div>
      </div>
    );
  }

  if (!data?.valid || !data.user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
        <h1 className="text-xl font-bold text-white">Lien Invalide ou Expiré</h1>
        <p className="text-sm text-slate-400">
          Le jeton de sécurité fourni ne correspond à aucun profil actif ou a été révoqué. Veuillez demander un nouveau lien au titulaire.
        </p>
      </div>
    );
  }

  const { fullName, status, lastPingAt } = data.user;
  const latestPing = data.latestPing;
  const isContactView = Boolean(data.isContactView || queryContactId);

  const formattedLastPing = lastPingAt
    ? new Date(lastPingAt).toLocaleString('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'medium',
      })
    : 'Inconnu';

  const mapsUrl = (isContactView && latestPing?.latitude && latestPing?.longitude)
    ? `https://maps.google.com/?q=${latestPing.latitude},${latestPing.longitude}`
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-6">
      
      {/* Top Banner Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
          {isContactView ? (
            <>
              <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Accès Proche Dédié {data.contactName ? `• ${data.contactName}` : ''}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Page de Suivi Publique Sécurisée</span>
            </>
          )}
        </div>

        <h1 className="text-3xl font-black text-white">Statut de {fullName}</h1>
        <p className="text-sm text-slate-400">
          {isContactView
            ? 'Vue détaillée d\'urgence pour proche autorisé.'
            : 'Seul le dernier check-in est affiché sur ce lien universel public.'}
        </p>
      </div>

      {/* Main Status Hero Card */}
      <div
        className={`p-8 sm:p-10 rounded-3xl border text-center shadow-2xl relative overflow-hidden transition-all duration-500 ${
          status === 'OK'
            ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-500/10'
            : status === 'WARNING'
            ? 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-amber-500/40 shadow-amber-500/10'
            : 'bg-gradient-to-br from-rose-950/70 via-slate-900 to-slate-950 border-rose-500/60 shadow-rose-500/20'
        }`}
      >
        <div className="relative z-10 space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-950/80 border-2 border-white/10 flex items-center justify-center shadow-inner">
            {status === 'OK' && <Heart className="w-10 h-10 text-emerald-400 fill-emerald-400/20 animate-pulse" />}
            {status === 'WARNING' && <AlertTriangle className="w-10 h-10 text-amber-400 animate-bounce" />}
            {status === 'ALERT' && <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />}
          </div>

          <div>
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider border ${
                status === 'OK'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : status === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/30 text-rose-300 border-rose-500/50'
              }`}
            >
              {status === 'OK' && '🟢 Tout va bien !'}
              {status === 'WARNING' && '🟠 Check-in en retard'}
              {status === 'ALERT' && '🔴 Alerte Déclenchée'}
            </span>
          </div>

          <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
            {status === 'OK' && `${fullName} a confirmé sa présence. Son chronomètre de sécurité est actif.`}
            {status === 'WARNING' && `${fullName} n'a pas encore effectué son check-in habituel.`}
            {status === 'ALERT' && `Attention : Aucun signalement reçu de ${fullName} depuis l'échéance du délai.`}
          </p>

          <div className="pt-5 border-t border-white/10 flex items-center justify-center text-sm text-slate-200">
            <div className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Dernier check-in enregistré : <strong className="text-white font-bold">{formattedLastPing}</strong></span>
            </div>
          </div>

          {/* Position shown ONLY on contact view */}
          {isContactView && latestPing?.locationName && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-300 pt-1 font-semibold">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Localisation : {latestPing.locationName}</span>
            </div>
          )}
        </div>
      </div>

      {/* GPS Map Snapshot link (ONLY on contact view) */}
      {isContactView && mapsUrl && (
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Localisation GPS transmise</h3>
              <p className="text-xs text-slate-400">
                Coordonnées : {latestPing?.latitude?.toFixed(4)}, {latestPing?.longitude?.toFixed(4)}
              </p>
            </div>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Recent Activity Feed (ONLY on contact view) */}
      {isContactView && data.recentPings && data.recentPings.length > 0 && (
        <div className="p-7 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Derniers Check-ins & Messages</span>
          </h3>

          <div className="space-y-3">
            {data.recentPings.map((ping) => (
              <div key={ping.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs gap-3">
                <div>
                  <span className="font-semibold text-white">{ping.message || 'Check-in 1-Tap'}</span>
                  {ping.locationName && (
                    <span className="block text-slate-400 text-[11px] mt-0.5">{ping.locationName}</span>
                  )}
                </div>
                <span className="text-slate-400 font-mono shrink-0">
                  {new Date(ping.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
