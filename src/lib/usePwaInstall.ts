'use client';

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Tracks whether the app is running installed (standalone display-mode) and
 * exposes the native "Add to Home Screen" prompt when the browser offers one.
 * Shared by FooterInstallPwa and anything that needs to gate a feature to
 * installed-PWA-only (e.g. PassiveMotionWidget).
 */
export function usePwaInstall() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () => {
      const isIosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
      setIsStandalone(mediaQuery.matches || isIosStandalone);
    };
    checkStandalone();
    mediaQuery.addEventListener('change', checkStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => setIsStandalone(true);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', checkStandalone);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isInstallable = Boolean(deferredPrompt);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return { isStandalone, isInstallable, promptInstall };
}
