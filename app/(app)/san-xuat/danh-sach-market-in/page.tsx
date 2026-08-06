'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { MarketInListPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <MarketInListPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
