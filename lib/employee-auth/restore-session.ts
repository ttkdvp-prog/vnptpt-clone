import { isApi } from '@/lib/data/config';
import { apiChangePassword, apiLogout, apiMe, apiSetPassword } from '@/lib/api/he-thong';
import { clearStoredApiToken } from '@/lib/api/client';
import { useAuthStore } from '@/store/useStore';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';
import { getSession, signOut } from 'next-auth/react';
import type { User } from '@/types';

function applyUserToStore(user: User): void {
  const { isAuthenticated, user: storedUser } = useAuthStore.getState();
  if (
    !isAuthenticated ||
    storedUser?.id !== user.id ||
    storedUser?.must_change_password !== user.must_change_password ||
    storedUser?.employee_id !== user.employee_id
  ) {
    useAuthStore.getState().login(user);
  } else {
    useAuthStore.getState().patchUser(user);
  }
}

/**
 * Sync Zustand auth store with Auth.js session (API/Postgres mode).
 */
export async function syncAuthStoreFromApiSession(): Promise<boolean> {
  if (!isApi()) return false;

  try {
    const session = await getSession();
    const user = session?.user;
    if (!user?.employee_id) {
      if (useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().logout();
        usePermissionGrantStore.getState().clearMatrix();
      }
      return false;
    }
    usePermissionGrantStore.getState().setMatrixGrants({}, user.cap_bac ?? null);

    // `must_change_password` được copy vào JWT lúc đăng nhập và không tự refresh
    // (next-auth không gọi lại authorize() mỗi request). Nếu admin đổi mật khẩu
    // của người này SAU khi JWT đã phát hành, session cũ vẫn mang cờ cũ suốt đời
    // token — overlay bằng giá trị thật từ DB mỗi lần sync. Đây cũng là mắt xích
    // phá vòng lặp redirect: sau khi tự đổi mật khẩu, /auth/me phải trả `false`
    // ngay, không đợi JWT hết hạn.
    let freshUser = user;
    try {
      const me = await apiMe();
      freshUser = { ...user, must_change_password: me.user.must_change_password };
    } catch {
      // Lỗi mạng/API — dùng nguyên giá trị từ JWT, không chặn luồng đăng nhập.
    }

    applyUserToStore(freshUser);
    return true;
  } catch {
    clearStoredApiToken();
    useAuthStore.getState().logout();
    usePermissionGrantStore.getState().clearMatrix();
    return false;
  }
}

/** Logout for current data source. */
export async function logoutCurrentSession(): Promise<void> {
  if (isApi()) {
    try {
      await signOut({ redirect: false });
      await apiLogout();
    } catch {
      /* ignore */
    }
    clearStoredApiToken();
    usePermissionGrantStore.getState().clearMatrix();
    useAuthStore.getState().logout();
    return;
  }
  useAuthStore.getState().logout();
}

export { apiChangePassword, apiSetPassword };
