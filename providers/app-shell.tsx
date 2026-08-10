'use client';

import { Suspense, lazy, type ReactNode } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { Toaster } from 'sonner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { CompanyBrandingSynchronizer } from '@/components/shared/CompanyBrandingSynchronizer';
import PwaRegister from '@/components/shared/PwaRegister';
import {
  ThemeSynchronizer,
  MetadataSynchronizer,
  LanguageSynchronizer,
  useResolvedTheme,
} from '@/lib/app-sync';
import { PermissionMatrixSynchronizer } from '@/components/auth/PermissionMatrixSynchronizer';
import { AuthSessionSynchronizer } from '@/components/auth/AuthSessionSynchronizer';

export function AppShell({ children }: { children: ReactNode }) {
  const resolvedTheme = useResolvedTheme();
  return (
    <LazyMotion features={domAnimation} strict>
      <ThemeSynchronizer />
      <MetadataSynchronizer />
      <LanguageSynchronizer />
      <PermissionMatrixSynchronizer />
      <AuthSessionSynchronizer />
      <CompanyBrandingSynchronizer />
      <ConfirmDialog />
      <PwaRegister />
      <Toaster position="top-right" richColors theme={resolvedTheme} />
      {children}
    </LazyMotion>
  );
}

export const PageFallback = () => (
  <div
    className="flex flex-col items-center justify-center min-h-[40vh]"
    aria-busy="true"
    aria-label="Đang mở trang"
  >
    <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

export function WithPageSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export const EmployeePage = lazy(() => import('@/features/he-thong/nhan-vien/index'));
export const CompanyInfoPage = lazy(() => import('@/features/he-thong/thong-tin-cong-ty/index'));
export const SecurityPage = lazy(() => import('@/features/he-thong/phan-quyen/index'));
export const TaiLieuPage = lazy(() => import('@/features/cong-viec/tai-lieu/index'));
export const CongViecPage = lazy(() => import('@/features/cong-viec/danh-sach-cong-viec/index'));
