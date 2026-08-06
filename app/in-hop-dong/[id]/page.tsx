'use client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ContractPrintPage, WithPageSuspense } from '@/providers/app-shell';

export default function Page() {
  return (
    <ProtectedRoute>
      <WithPageSuspense>
        <ContractPrintPage />
      </WithPageSuspense>
    </ProtectedRoute>
  );
}
