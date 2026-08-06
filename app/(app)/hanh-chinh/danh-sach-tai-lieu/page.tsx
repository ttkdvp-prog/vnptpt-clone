'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { DocumentListPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <DocumentListPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
