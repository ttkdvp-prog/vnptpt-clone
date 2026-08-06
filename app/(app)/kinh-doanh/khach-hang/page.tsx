'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { CustomerListPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <CustomerListPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
