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
            <h1 className="text-2xl font-black text-white">Détection Automatique</h1>
            <p className="text-sm text-slate-400 mt-1">
              Quand vous bougez avec votre téléphone en poche, l'application le remarque et fait le check-in à votre place.
            </p>
          </div>
        </div>
      </div>

      {/* Main Widget */}
      <PassiveMotionWidget />

      {/* Explanation Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-400" />
          <span>Comment ça marche ?</span>
        </h3>

        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Aucune action requise :</strong> tant que cette option est activée, marcher ou vous déplacer avec votre téléphone suffit à montrer que vous allez bien.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Réservé à l&apos;application installée :</strong> un onglet de navigateur classique peut être fermé à tout moment, donc les check-in automatiques réels ne fonctionnent qu&apos;une fois l&apos;app installée sur l&apos;écran d&apos;accueil. Sans installation, cette page reste en mode démo.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Un vrai check-in reste toujours préférable :</strong> la détection automatique est un complément pratique, mais le tap manuel matin/soir reste le moyen le plus fiable de rassurer vos proches.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Un rappel avant l'échéance :</strong> si rien n'a été détecté et que l'heure du check-in approche, l'application vous envoie une notification pour vous le rappeler.
            </span>
          </li>
        </ul>
      </div>

    </div>
  );
}
