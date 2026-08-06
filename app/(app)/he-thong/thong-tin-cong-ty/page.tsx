'use client';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { CompanyInfoPage, WithPageSuspense } from '@/providers/app-shell';
export default function Page() {
  return (
    <ModulePermissionRoute>
      <WithPageSuspense><CompanyInfoPage /></WithPageSuspense>
    </ModulePermissionRoute>
  );
}
