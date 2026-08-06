'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { ContactListPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <ContactListPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
