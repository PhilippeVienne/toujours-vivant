'use client';

import { useState } from 'react';
import { useDeviceMotion } from '@/lib/useDeviceMotion';
import { usePwaInstall } from '@/lib/usePwaInstall';
import { Activity, Smartphone, MousePointer, Shield, Zap, Download, FlaskConical } from 'lucide-react';

export function PassiveMotionWidget() {
  const [sensitivity] = useState(14.0);
  const { isStandalone, isInstallable, promptInstall } = usePwaInstall();

  // Real check-ins only fire when the app is installed (standalone PWA): a
  // regular browser tab can be closed or backgrounded at any time, so
  // "detection" there would be a false sense of security. Outside the PWA
  // this stays a visual demo — motion is still tracked below, just never
  // sent to the server.
  const handleAutoPing = async () => {
    if (!isStandalone) return;
    try {
      await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pingType: 'PASSIVE_MOTION',
          message: 'Ping automatique validé par détection de mouvement (Accéléromètre / Souris)',
        }),
      });
    } catch (err) {
      console.error('Auto ping error:', err);
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
    } else {
      alert("Pour installer l'application PWA :\n\n• Sur Android / Chrome : Cliquez sur les 3 points en haut à droite > 'Ajouter à l'écran d'accueil'.\n• Sur iPhone / Safari : Cliquez sur le bouton de partage > 'Sur l'écran d'accueil'.");
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

      {/* Demo Mode Banner (not installed as PWA) */}
      {!isStandalone && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-2.5 text-amber-300">
            <FlaskConical className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>Mode démo :</strong> dans un onglet de navigateur classique, aucun check-in réel n&apos;est envoyé (l&apos;onglet peut être fermé à tout moment). Installez l&apos;application pour activer la détection pour de vrai.
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer l&apos;app</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Détection Automatique</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold border ${
                !isStandalone
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                {!isStandalone ? 'Démo' : isDesktopSimulated ? 'Simulation PC' : 'Sur ce téléphone'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Valide automatiquement votre check-in quand vous vous déplacez.
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
            <span>Niveau d'activité</span>
            <Zap className="w-4 h-4 text-indigo-400" />
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
            Depuis l'activation
          </div>
        </div>

        {/* Last Auto Ping */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isStandalone ? 'Dernier Auto-Ping' : 'Dernier Mouvement (démo)'}</span>
            <Shield className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-sm sm:text-base font-bold text-white">
            {lastAutoPingTime ? lastAutoPingTime.toLocaleTimeString('fr-FR') : 'Aucun aujourd\'hui'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {isStandalone ? 'Automatique lors des mouvements' : 'Non envoyé au serveur en mode démo'}
          </div>
        </div>

      </div>

      {/* Sensor Status Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {isDesktopSimulated ? (
            <>
              <MousePointer className="w-4 h-4 text-indigo-400" />
              <span>Mode démonstration PC : les mouvements de la souris simulent la détection 🟢</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>
                {permissionGranted
                  ? 'Détection active sur ce téléphone 🟢'
                  : 'Autorisation requise pour activer la détection'}
              </span>
            </>
          )}
        </div>

        {!permissionGranted && !isDesktopSimulated && (
          <button
            onClick={requestPermission}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Activer la détection (iOS)
          </button>
        )}
      </div>

    </div>
  );
}
