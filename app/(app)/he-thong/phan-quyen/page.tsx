'use client';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { SecurityPage, WithPageSuspense } from '@/providers/app-shell';
export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense><SecurityPage /></WithPageSuspense>
    </ModulePermissionRoute>
  );
}
