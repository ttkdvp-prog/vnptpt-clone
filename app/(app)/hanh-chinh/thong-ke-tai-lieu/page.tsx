'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { DocumentStatsPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <DocumentStatsPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
