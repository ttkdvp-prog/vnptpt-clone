import { useEffect } from 'react';
import { isApi } from '@/lib/data/config';
import { syncAuthStoreFromApiSession } from '@/lib/employee-auth/restore-session';
import { useAuthStore } from '@/store/useStore';

/** Keeps Zustand auth in sync with Auth.js session (API mode). */
export function AuthSessionSynchronizer(): null {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isApi()) return;

    void syncAuthStoreFromApiSession();
  }, [hasHydrated]);

  return null;
}
