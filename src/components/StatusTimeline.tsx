'use client';

import { Activity, Heart, MapPin, Smartphone, Clock } from 'lucide-react';
import { PingLog } from '@/types';
import { formatRelativeTimeCompact } from '@/lib/formatTime';

interface StatusTimelineProps {
  pings: PingLog[];
}

export function StatusTimeline({ pings }: StatusTimelineProps) {
  if (!pings || pings.length === 0) {
    return (
      <div className="p-8 rounded-3xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-xl text-center text-slate-400 text-sm">
        Aucun check-in enregistré pour le moment.
      </div>
    );
  }

  const getPingBadge = (type: string) => {
    switch (type) {
      case 'MANUAL':
        return {
          label: 'Ping Manuel 1-Tap',
          icon: Heart,
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'PASSIVE_MOTION':
        return {
          label: 'Accéléromètre (Passif)',
          icon: Activity,
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        };
      case 'PUSH_CHECKIN':
        return {
          label: 'Notification Push',
          icon: Smartphone,
          color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        };
      default:
        return {
          label: 'Check-in',
          icon: Clock,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 backdrop-blur-xl p-7 sm:p-8 shadow-2xl space-y-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
        <Clock className="w-5 h-5 text-emerald-400" />
        <span>Historique des Check-ins & Pings</span>
      </h3>

      <div className="relative pl-7 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800/80">
        {pings.map((ping) => {
          const badge = getPingBadge(ping.pingType);
          const Icon = badge.icon;
          const formattedDate = formatRelativeTimeCompact(ping.createdAt);

          return (
            <div key={ping.id} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[27px] top-4 w-4 h-4 rounded-full bg-slate-950 border-2 border-emerald-400 group-hover:scale-125 transition-transform" />

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {badge.label}
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-medium">{formattedDate}</span>
                </div>

                {ping.message && (
                  <p className="text-sm text-slate-200 font-medium leading-relaxed pt-1">{ping.message}</p>
                )}

                {ping.locationName && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{ping.locationName}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
