export interface User {
  id: string;
  /** he_thong_nhan_vien.id — business entity id */
  employee_id?: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  created_at: string;
  /** HR tạo MK tạm — bắt đổi lần đầu đăng nhập */
  must_change_password?: boolean;
  /** false khi nghỉ việc / admin vô hiệu hóa */
  tai_khoan_dang_hoat_dong?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** Chỉ dùng nội bộ: true khi đã đọc xong state từ localStorage/sessionStorage (tránh redirect về login khi reload). */
  _hasHydrated?: boolean;
  login: (user: User) => void;
  patchUser: (patch: Partial<User>) => void;
  logout: () => void;
}

export interface ProfileFormValues {
  fullName: string;
  email: string;
  bio?: string;
}

/** In-app notification (bell dropdown list) */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: NotificationType;
  read: boolean;
  createdAt: string; // ISO
  link?: string; // optional route or URL
}

export * from './crud';