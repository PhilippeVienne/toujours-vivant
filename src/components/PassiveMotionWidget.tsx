'use client';

import { useState } from 'react';
import { useDeviceMotion } from '@/lib/useDeviceMotion';
import { Activity, Smartphone, MousePointer, Shield, Zap } from 'lucide-react';
import { getAuthHeaders } from '@/lib/supabase';

export function PassiveMotionWidget() {
  const [sensitivity] = useState(14.0);

  const handleAutoPing = async () => {
    try {
      await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          pingType: 'PASSIVE_MOTION',
          message: 'Ping automatique validé par détection de mouvement (Accéléromètre / Souris)',
        }),
      });
    } catch (err) {
      console.error('Auto ping error:', err);
    }
  };

  const {
    isSupported,
    permissionGranted,
    isListening,
    isDesktopSimulated,
    currentMagnitude,
    motionCount,
    lastAutoPingTime,
    requestPermission,
    startListening,
    stopListening,
  } = useDeviceMotion({
    sensitivity,
    onAutoPing: handleAutoPing,
  });

  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-900/90 backdrop-blur-xl p-7 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Détection de Mouvement Passif</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {isDesktopSimulated ? 'Simulation Souris PC' : 'Accéléromètre Mobile'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Valide automatiquement votre check-in lors de vos déplacements ou mouvements.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        {isSupported && (
          <button
            onClick={isListening ? stopListening : startListening}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
              isListening ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                isListening ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Meter */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isDesktopSimulated ? 'Vitesse Souris' : 'Intensité Accélération'}</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {currentMagnitude.toFixed(1)} <span className="text-xs text-slate-500 font-sans">m/s²</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full transition-all duration-150"
              style={{ width: `${Math.min(100, (currentMagnitude / 30) * 100)}%` }}
            />
          </div>
        </div>

        {/* Motion Count */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Mouvements Détectés</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {motionCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Seuil configuré : {sensitivity.toFixed(1)} m/s²
          </div>
        </div>

        {/* Last Auto Ping */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Dernier Auto-Ping</span>
            <Shield className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white">
            {lastAutoPingTime ? lastAutoPingTime.toLocaleTimeString('fr-FR') : 'Aucun aujourd\'hui'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Automatique lors des mouvements
          </div>
        </div>

      </div>

      {/* Sensor Status Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {isDesktopSimulated ? (
            <>
              <MousePointer className="w-4 h-4 text-indigo-400" />
              <span>Mode Démonstration PC : Mouvements de la souris simulent l'accéléromètre 🟢</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>
                {permissionGranted
                  ? 'Capteur accéléromètre actif & autorisé 🟢'
                  : 'Permission de détection de mouvement requise sur smartphone'}
              </span>
            </>
          )}
        </div>

        {!permissionGranted && !isDesktopSimulated && (
          <button
            onClick={requestPermission}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Activer l'accéléromètre (iOS)
          </button>
        )}
      </div>

    </div>
  );
}
