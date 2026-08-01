'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Disable and purge Service Worker & Caches in local development to prevent HMR & reload loops
    const isDev = process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost';

    if (isDev) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((unregistered) => {
            if (unregistered) {
              console.log('🧹 Service Worker nettoyé pour l\'environnement de développement.');
            }
          });
        }
      });

      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      return;
    }

    // Register Service Worker in production build only
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('🟢 Service Worker enregistré avec succès:', registration.scope);
      })
      .catch((error) => {
        console.warn('⚠️ Échec de l\'enregistrement du Service Worker:', error);
      });
  }, []);

  return null;
}
