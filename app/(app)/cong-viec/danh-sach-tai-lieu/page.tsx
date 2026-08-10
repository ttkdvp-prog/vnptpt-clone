'use client';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { TaiLieuPage, WithPageSuspense } from '@/providers/app-shell';
export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense><TaiLieuPage /></WithPageSuspense>
    </ModulePermissionRoute>
  );
}
