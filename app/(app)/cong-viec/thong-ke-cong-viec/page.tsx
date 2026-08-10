'use client';
import { useEffect } from 'react';
import { ModulePermissionRoute } from '@/components/auth/ModulePermissionRoute';
import { CongViecPage, WithPageSuspense } from '@/providers/app-shell';
import { useSearchParams } from '@/lib/navigation';

/** Cùng module với danh-sach-cong-viec, chỉ khác tab mặc định — tránh trùng logic list/stats. */
export default function Page() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('tab') !== 'stats') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'stats');
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi mount / khi tab bị đổi khỏi stats từ bên ngoài
  }, [searchParams]);

  return (
    <ModulePermissionRoute>
      <WithPageSuspense><CongViecPage /></WithPageSuspense>
    </ModulePermissionRoute>
  );
}
