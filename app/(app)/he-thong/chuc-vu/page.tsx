'use client';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { PositionPage, WithPageSuspense } from '@/providers/app-shell';
export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense><PositionPage /></WithPageSuspense>
    </ModulePermissionRoute>
  );
}
