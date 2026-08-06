'use client';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { DepartmentPage, WithPageSuspense } from '@/providers/app-shell';
export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense><DepartmentPage /></WithPageSuspense>
    </ModulePermissionRoute>
  );
}
