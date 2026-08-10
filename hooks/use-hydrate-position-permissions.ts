import { useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';

/**
 * Sau đăng nhập / đổi user: đặt matrix theo role — `admin` = super user (mọi module),
 * còn lại dùng luật legacy. Chức vụ / phòng ban đã bị xóa khỏi mô hình dữ liệu nên
 * không còn hydrate theo `id_chuc_vu` nữa.
 */
export function useHydratePositionPermissions(): void {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user || user.role !== 'admin') {
      // Không phải admin → tắt matrix, dùng luật legacy (view mọi module).
      usePermissionGrantStore.getState().clearMatrix();
      return;
    }
    usePermissionGrantStore.getState().setMatrixGrants({}, 1);
  }, [hasHydrated, user]);
}
