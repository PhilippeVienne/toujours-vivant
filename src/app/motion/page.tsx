'use client';

import { PassiveMotionWidget } from '@/components/PassiveMotionWidget';
import { Activity, ShieldCheck, Info } from 'lucide-react';

export default function MotionPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Ping Passif & Background Sync</h1>
            <p className="text-sm text-slate-400 mt-1">
              Détection automatique d'activité physique grâce aux capteurs accéléromètre de votre smartphone.
            </p>
          </div>
        </div>
      </div>

      {/* Main Widget */}
      <PassiveMotionWidget />

      {/* Technical Explanation Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-400" />
          <span>Comment fonctionne le Ping Passif ?</span>
        </h3>

        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Accéléromètre en temps réel :</strong> L'application analyse l'amplitude des mouvements (<code className="text-indigo-300">DeviceMotionEvent</code>).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Validation automatique 30 min :</strong> Chaque fois qu'une activité physique significative est détectée, le timer Upstash Redis est automatiquement réinitialisé à 30 minutes.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Fallback iOS Safari :</strong> En cas de mise en veille prolongée par le système, une notification Push de rappel est envoyée à 25 minutes pour vous inciter à valider d'un tap.
            </span>
          </li>
        </ul>
      </div>

    </div>
  );
}
