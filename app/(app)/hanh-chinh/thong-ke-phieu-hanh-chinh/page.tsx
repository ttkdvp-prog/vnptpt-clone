'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { AdminFormStatsPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <AdminFormStatsPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
