'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Clock, RefreshCw, Plane } from 'lucide-react';
import { UserStatus } from '@/types';

interface StatusBadgeProps {
  initialStatus: UserStatus;
  initialSecondsRemaining: number;
  totalSeconds?: number;
  lastPingAt?: string;
  onRefresh?: () => void;
}

export function StatusBadge({
  initialStatus,
  initialSecondsRemaining,
  totalSeconds,
  onRefresh,
}: StatusBadgeProps) {
  const [seconds, setSeconds] = useState(initialSecondsRemaining);
  const [status, setStatus] = useState<UserStatus>(initialStatus);

  useEffect(() => {
    setSeconds(initialSecondsRemaining);
    setStatus(initialStatus);
  }, [initialSecondsRemaining, initialStatus]);

  useEffect(() => {
    // While offline/paused, the countdown doesn't run — nothing to tick down.
    if (status === 'PAUSED') return;

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setStatus('ALERT');
          return 0;
        }
        if (prev <= 300 && status === 'OK') {
          setStatus('WARNING');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (totalSecondsValue: number) => {
    if (totalSecondsValue >= 3600) {
      const hours = Math.floor(totalSecondsValue / 3600);
      const minutes = Math.floor((totalSecondsValue % 3600) / 60);
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    const minutes = Math.floor(totalSecondsValue / 60);
    const secs = totalSecondsValue % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressDenominator = totalSeconds && totalSeconds > 0 ? totalSeconds : 1800;
  const progressPercent = Math.min(100, Math.max(0, (seconds / progressDenominator) * 100));

  const getStatusStyles = () => {
    switch (status) {
      case 'OK':
        return {
          bg: 'from-emerald-950/40 via-slate-900/90 to-slate-950/90 border-emerald-500/30 shadow-emerald-950/30',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          title: 'TOUT VA BIEN',
          description: 'Vos proches sont rassurés. Votre chronomètre de sécurité est actif.',
          glow: 'bg-emerald-500/20',
          progressBg: 'bg-emerald-400',
          icon: ShieldCheck,
          iconColor: 'text-emerald-400',
        };
      case 'WARNING':
        return {
          bg: 'from-amber-950/40 via-slate-900/90 to-slate-950/90 border-amber-500/40 shadow-amber-950/30',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
          title: 'CHECK-IN RECOMMANDÉ',
          description: 'Timer bientôt à échéance. Effectuez un ping en 1 tap !',
          glow: 'bg-amber-500/20',
          progressBg: 'bg-amber-400',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
        };
      case 'ALERT':
        return {
          bg: 'from-rose-950/50 via-slate-900/95 to-slate-950/95 border-rose-500/50 shadow-rose-950/40',
          badgeBg: 'bg-rose-500/30 text-rose-300 border-rose-500/50 animate-bounce',
          title: 'ALERTE DÉCLENCHÉE',
          description: 'Compte à rebours écoulé. Notification d\'urgence transmise aux proches.',
          glow: 'bg-rose-500/30',
          progressBg: 'bg-rose-500',
          icon: AlertTriangle,
          iconColor: 'text-rose-400',
        };
      case 'PAUSED':
        return {
          bg: 'from-indigo-950/40 via-slate-900/90 to-slate-950/90 border-indigo-500/30 shadow-indigo-950/30',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          title: 'HORS RÉSEAU',
          description: 'Vous êtes en mode hors réseau. Vos proches ne recevront pas d\'alerte tant que vous n\'êtes pas rentré(e).',
          glow: 'bg-indigo-500/20',
          progressBg: 'bg-indigo-400',
          icon: Plane,
          iconColor: 'text-indigo-400',
        };
      default:
        return {
          bg: 'from-slate-900 to-slate-950 border-slate-800',
          badgeBg: 'bg-slate-800 text-slate-400',
          title: 'EN PAUSE',
          description: 'Suivi désactivé.',
          glow: 'bg-slate-800',
          progressBg: 'bg-slate-600',
          icon: Clock,
          iconColor: 'text-slate-400',
        };
    }
  };

  const style = getStatusStyles();
  const Icon = style.icon;

  return (
    <div className={`relative overflow-hidden rounded-3xl border p-7 sm:p-9 bg-gradient-to-br ${style.bg} backdrop-blur-xl shadow-2xl transition-all duration-500`}>
      {/* Radial Glow */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full ${style.glow} blur-3xl pointer-events-none`} />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
        
        {/* Status details */}
        <div className="flex items-start gap-5 max-w-2xl">
          <div className={`p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-white/10 ${style.iconColor} shadow-xl flex-shrink-0 mt-0.5`}>
            <Icon className="w-9 h-9 sm:w-10 sm:h-10" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${style.badgeBg}`}>
                {style.title}
              </span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 border border-slate-700/60 font-semibold"
                  title="Actualiser le statut"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Actualiser</span>
                </button>
              )}
            </div>
            <p className="text-slate-200 text-sm sm:text-base font-medium leading-relaxed">{style.description}</p>
          </div>
        </div>

        {/* Countdown Timer Display */}
        <div className="w-full md:w-auto flex flex-col items-stretch md:items-end bg-slate-950/90 border border-slate-800 rounded-2xl p-5 sm:px-7 sm:py-5 shadow-2xl min-w-[220px]">
          <div className="flex items-center justify-between md:justify-end gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{status === 'PAUSED' ? 'Fin du mode hors réseau' : 'Prochain check-in dans'}</span>
          </div>
          
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white text-center md:text-right my-0.5">
            {formatTime(seconds)}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden mt-3 p-0.5 border border-slate-700/40">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${style.progressBg}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
