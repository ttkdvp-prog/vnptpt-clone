'use client';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { HopDongListPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <HopDongListPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
