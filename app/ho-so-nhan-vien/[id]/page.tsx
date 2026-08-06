'use client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmployeeProfilePreviewPage, WithPageSuspense } from '@/providers/app-shell';
export default function Page() {
  return (
    <ProtectedRoute>
      <WithPageSuspense><EmployeeProfilePreviewPage /></WithPageSuspense>
    </ProtectedRoute>
  );
}
