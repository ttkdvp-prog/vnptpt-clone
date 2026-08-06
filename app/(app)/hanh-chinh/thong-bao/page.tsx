'use client';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { ThongBaoListPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense>
        <ThongBaoListPage />
      </WithPageSuspense>
    </ModulePermissionRoute>
  );
}
