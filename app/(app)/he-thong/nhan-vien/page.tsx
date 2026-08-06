'use client';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { EmployeePage, WithPageSuspense } from '@/providers/app-shell';
export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense><EmployeePage /></WithPageSuspense>
    </ModulePermissionRoute>
  );
}
