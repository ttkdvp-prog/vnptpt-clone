'use client';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { CongViecPage, WithPageSuspense } from '@/providers/app-shell';
export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense><CongViecPage /></WithPageSuspense>
    </ModulePermissionRoute>
  );
}
