'use client';

import { useEffect } from 'react';
import { useCompanyBranding } from '@/features/he-thong/thong-tin-cong-ty/hooks/use-cong-ty';
import { useAuthStore, useUIStore } from '@/store/useStore';

/**
 * After login, hydrate sidebar / tab title / favicon branding from
 * Thông tin công ty (public fields only — any authenticated user).
 */
export function CompanyBrandingSynchronizer(): null {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setCompanyInfo = useUIStore((s) => s.setCompanyInfo);

  const { data } = useCompanyBranding(hasHydrated && isAuthenticated);

  useEffect(() => {
    if (!data) return;
    if (!data.appName.trim()) return;
    setCompanyInfo({
      appName: data.appName,
      appDescription: data.appDescription,
      appLogo: data.appLogo,
    });
  }, [data, setCompanyInfo]);

  return null;
}
