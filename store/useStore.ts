import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import type { AppFontFamily } from '@/lib/theme/fonts';
import { AuthState, User } from '@/types';
import { AUTH_REMEMBER_KEY, AUTH_STORAGE_KEY } from '@/lib/employee-auth/session-lifetime';
import { usePermissionGrantStore } from './usePermissionGrantStore';

/** Đã "Ghi nhớ đăng nhập" hay chưa. Thiếu key = ghi nhớ (mặc định của form login). */
export function isAuthRemembered(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(AUTH_REMEMBER_KEY) !== 'false';
}

/**
 * Storage đang dùng cho auth: ghi nhớ → localStorage, không ghi nhớ → sessionStorage
 * (đóng trình duyệt là thoát).
 *
 * Phải giải lại ở MỖI lần đọc/ghi, không được chốt lúc module load: người dùng đổi
 * lựa chọn ngay trên form login rồi điều hướng bằng SPA, không có lần reload nào để
 * bind lại adapter.
 */
function activeAuthStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return isAuthRemembered() ? localStorage : sessionStorage;
}

/**
 * Ghi lựa chọn "Ghi nhớ đăng nhập" và dọn bản sao ở storage không còn dùng, tránh
 * để hồ sơ người dùng cũ nằm lại localStorage vô thời hạn sau khi chuyển sang chế
 * độ không ghi nhớ.
 */
export function setAuthRemember(remember: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_REMEMBER_KEY, remember ? 'true' : 'false');
  (remember ? sessionStorage : localStorage).removeItem(AUTH_STORAGE_KEY);
}

type AuthPersistedState = Pick<AuthState, 'user' | 'isAuthenticated'>;

/** Storage adapter cho zustand persist: phải trả về object { state, version }, lưu dạng JSON. */
function createAuthPersistStorage(): PersistStorage<AuthPersistedState> {
  return {
    getItem: (name: string) => {
      const raw = activeAuthStorage()?.getItem(name);
      return raw ? (JSON.parse(raw) as { state: AuthPersistedState; version?: number }) : null;
    },
    setItem: (name: string, value: { state: AuthPersistedState; version?: number }) => {
      activeAuthStorage()?.setItem(name, JSON.stringify(value));
    },
    removeItem: (name: string) => {
      // Dọn cả hai: lựa chọn có thể đã đổi giữa lúc ghi và lúc xóa.
      if (typeof window === 'undefined') return;
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
    },
  };
}

export const useAuthStore = create<AuthState>()(
  persist<AuthState, [], [], AuthPersistedState>(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
  login: (user: User) => set({ user, isAuthenticated: true }),
  patchUser: (patch: Partial<User>) =>
    set((state) =>
      state.user ? { user: { ...state.user, ...patch } } : state,
    ),
  logout: () => {
        usePermissionGrantStore.getState().clearMatrix();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      version: 2,
      storage: createAuthPersistStorage(),
      partialize: (state): AuthPersistedState => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hasHydrated: true });
      },
      migrate: (persisted: unknown, version: number) => {
        if (!persisted || typeof persisted !== 'object') return persisted as AuthState;
        const state = persisted as AuthState;
        if (version < 1) {
          if (state.user?.id === '123' || state.user?.email === 'demo@example.com') {
            state.user = {
              id: 'emp-000',
              email: 'admin@5fedu.com',
              full_name: 'Lê Minh Công',
              role: 'admin',
              created_at: new Date().toISOString(),
            };
            state.isAuthenticated = true;
          }
        }
        if (version < 2 && state.user?.id === 'user-123') {
          state.user = {
            ...state.user,
            id: 'emp-000',
            role: 'admin',
          };
        }
        return state;
      },
    }
  )
);

interface CompanyInfo {
  appName: string;
  appDescription: string; // New field for short description
  appLogo: string | null; // Base64 string or URL
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  representative: string;
  representativeTitle: string;
  signingPlace: string;
}

interface ThemeState {
  primaryColor: 'blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'orange' | 'cyan' | 'slate';
  fontFamily: AppFontFamily;
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: 'light' | 'dark' | 'system';
  timezone: string;
  setTheme: (settings: Partial<Omit<ThemeState, 'setTheme'>>) => void;
}

interface UIState extends ThemeState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  // Branding & Company Info
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: Partial<CompanyInfo>) => void;
  // User Preferences
  skipRedirectConfirmation: boolean;
  setSkipRedirectConfirmation: (skip: boolean) => void;
}

/** Allowed font families – used for migration from old settings. */
const ALLOWED_FONTS = new Set<AppFontFamily>([
  'Inter',
  'Be Vietnam Pro',
  'Lexend',
  'Nunito',
  'Source Sans 3',
  'Merriweather',
]);

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Default Theme Settings
      primaryColor: 'blue',
      fontFamily: 'Inter',
      fontSize: 'medium',
      colorScheme: 'light',
      timezone: 'Asia/Ho_Chi_Minh',
      setTheme: (settings) => {
        set((state) => ({ ...state, ...settings }));
      },

      // Default Company Info (overridden by CompanyBrandingSynchronizer after login)
      companyInfo: {
        appName: 'An Hưng Thịnh ERP',
        appDescription: 'Ứng dụng quản lý ERP',
        appLogo: null,
        companyName: 'An Hưng Thịnh',
        taxId: '0101234567',
        address: 'Số 1 Đường Mẫu, Quận 1, TP. Hồ Chí Minh',
        phone: '028 1234 5678',
        email: 'contact@company.vn',
        website: 'www.company.vn',
        representative: 'Nguyễn Văn Thành',
        representativeTitle: 'Giám đốc',
        signingPlace: 'TP. Hồ Chí Minh',
      },
      setCompanyInfo: (info) => set((state) => ({
        companyInfo: { ...state.companyInfo, ...info }
      })),

      // User Preferences
      skipRedirectConfirmation: false,
      setSkipRedirectConfirmation: (skip) => set({ skipRedirectConfirmation: skip }),
    }),
    {
      name: 'ui-storage',
      version: 3,
      // companyInfo KHÔNG persist: phải luôn lấy trực tiếp từ Thông tin công ty
      // (CompanyBrandingSynchronizer) mỗi lần tải trang — nếu cache localStorage,
      // rehydrate của zustand chạy async có thể hoàn tất SAU khi đã fetch xong tên
      // mới, ghi đè state và làm tên app "nhảy" về giá trị cache cũ/mặc định.
      partialize: (state) => {
        const { companyInfo: _companyInfo, ...rest } = state;
        return rest;
      },
      migrate: (persisted: unknown, version: number) => {
        if (!persisted || typeof persisted !== 'object') return persisted as UIState;
        const state = persisted as Record<string, unknown> & Partial<ThemeState> & {
          companyInfo?: Partial<CompanyInfo>;
          language?: unknown;
        };
        // v0 → v1: fonts list reduced
        if (
          version === 0 &&
          state.fontFamily &&
          typeof state.fontFamily === 'string' &&
          !ALLOWED_FONTS.has(state.fontFamily as ThemeState['fontFamily'])
        ) {
          state.fontFamily = 'Inter';
        }
        // v1 → v2: chỉ còn tiếng Việt — bỏ language khỏi state đã lưu
        if (version < 2) {
          delete state.language;
        }
        // v2 → v3: company legal fields for labor contracts
        if (version < 3 && state.companyInfo && typeof state.companyInfo === 'object') {
          state.companyInfo = {
            ...state.companyInfo,
            representative: state.companyInfo.representative ?? '',
            representativeTitle: state.companyInfo.representativeTitle ?? '',
            signingPlace: state.companyInfo.signingPlace ?? '',
          };
        }
        return persisted as UIState;
      },
    }
  )
);