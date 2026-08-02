'use client';

import { useState } from 'react';
import { Plane, PlaneLanding, Loader2, Check } from 'lucide-react';
import { getAuthHeaders } from '@/lib/supabase';
import { UserStatus } from '@/types';

interface OfflineToggleProps {
  status: UserStatus;
  offlineUntil?: string | null;
  onChange?: () => void;
}

const DURATION_PRESETS = [
  { hours: 24, label: '1 jour' },
  { hours: 72, label: '3 jours' },
  { hours: 168, label: '1 semaine' },
];

export function OfflineToggle({ status, offlineUntil, onChange }: OfflineToggleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customDays, setCustomDays] = useState('2');

  const isOffline = status === 'PAUSED';

  const activateOffline = async (hours: number) => {
    setLoading(true);
    try {
      await fetch('/api/user/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ durationHours: hours }),
      });
      setShowPicker(false);
      onChange?.();
    } catch (err) {
      console.error('Offline activation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resumeOnline = async () => {
    setLoading(true);
    try {
      await fetch('/api/user/offline', {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });
      onChange?.();
    } catch (err) {
      console.error('Offline resume error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isOffline) {
    const until = offlineUntil ? new Date(offlineUntil).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : null;
    return (
      <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Vous êtes en mode hors réseau</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {until ? `Aucune alerte ne sera envoyée jusqu'au ${until}.` : "Aucune alerte ne sera envoyée pour l'instant."}
            </p>
          </div>
        </div>
        <button
          onClick={resumeOnline}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlaneLanding className="w-4 h-4" />}
          <span>Je suis de retour</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Vous partez en zone sans réseau ?</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Prévenez l'application pour suspendre les alertes le temps de votre absence.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all shrink-0"
        >
          <span>Je pars hors réseau</span>
        </button>
      </div>

      {showPicker && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 animate-fade-in">
          <p className="text-xs font-semibold text-slate-300">Pendant combien de temps ?</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.hours}
                onClick={() => activateOffline(preset.hours)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700">
              <input
                type="number"
                min={1}
                max={30}
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="w-12 bg-transparent text-white text-xs font-mono text-center focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">jours</span>
              <button
                onClick={() => activateOffline(Math.max(1, Math.min(30, Number(customDays) || 1)) * 24)}
                disabled={loading}
                className="ml-1 p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 disabled:opacity-50"
                title="Confirmer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
