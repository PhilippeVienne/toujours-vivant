'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

export function FooterInstallPwa() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    if (typeof window !== 'undefined') {
      const isPwa = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(Boolean(isPwa));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert("Pour installer l'application PWA :\n\n• Sur Android / Chrome : Cliquez sur les 3 points en haut à droite > 'Ajouter à l'écran d'accueil'.\n• Sur iPhone / Safari : Cliquez sur le bouton de partage > 'Sur l'écran d'accueil'.");
    }
  };

  if (isStandalone) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
        <Smartphone className="w-3.5 h-3.5" />
        <span>PWA Installée 🟢</span>
      </span>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
    >
      <Download className="w-3.5 h-3.5" />
      <span>{isInstallable ? 'Installer l\'application (PWA)' : 'Installer PWA'}</span>
    </button>
  );
}
