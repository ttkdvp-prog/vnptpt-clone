'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { CustomerSettingsPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <CustomerSettingsPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
