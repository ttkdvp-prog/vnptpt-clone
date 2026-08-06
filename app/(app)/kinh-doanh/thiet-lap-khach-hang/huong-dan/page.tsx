'use client';

import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { WithPageSuspense } from '@/providers/app-shell';
import ModuleGuidePage from '@/views/guide/ModuleGuidePage';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <ModuleGuidePage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
