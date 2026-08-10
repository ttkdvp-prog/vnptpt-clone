import { useEmployee } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { txt } from '@/lib/text';
import type { User } from '@/types';

export interface CurrentUserDisplay {
  displayName: string;
  positionName: string | undefined;
  avatarName: string;
  avatarUrl: string | undefined;
}

/** Tên hiển thị topbar — từ hồ sơ NV, fallback metadata session. */
export function useCurrentUserDisplay(user: User | null | undefined): CurrentUserDisplay {
  const { data: employee } = useEmployee(user?.employee_id ?? null);

  const displayName = employee?.ho_ten ?? user?.full_name ?? txt('nav.guestUser');
  const avatarName = employee?.ho_ten ?? user?.full_name ?? 'User';

  return {
    displayName,
    positionName: undefined,
    avatarName,
    avatarUrl: employee?.anh_dai_dien ?? user?.avatar_url,
  };
}
