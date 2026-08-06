'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { PayrollSettingsPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <PayrollSettingsPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
