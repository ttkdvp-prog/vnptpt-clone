'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { DocumentSettingsPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <DocumentSettingsPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
