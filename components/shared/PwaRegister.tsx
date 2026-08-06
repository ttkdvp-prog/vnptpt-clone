'use client';

import { useEffect } from 'react';

/**
 * Service worker cleanup — vite-plugin-pwa removed in Phase 1.
 *
 * Installable PWA (manifest + icons) is enabled via `app/manifest.ts`.
 * Offline Serwist SW is not shipped yet. Older Vite builds left a `sw.js`
 * that can throw `no-response` after HMR; unregister leftovers and clear caches.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        if (registrations.length === 0) {
          return;
        }
        return Promise.all(registrations.map((registration) => registration.unregister())).then(
          () => {
            if ('caches' in window) {
              return caches
                .keys()
                .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
                .then(() => undefined);
            }
            return undefined;
          },
        );
      })
      .catch(() => {
        // Best-effort cleanup; ignore failures.
      });
  }, []);

  return null;
}
