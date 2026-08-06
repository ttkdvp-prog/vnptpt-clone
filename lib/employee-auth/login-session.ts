import { loginNameToAuthEmail } from '@/lib/auth-email';
import { normalizeLoginName } from '@/lib/validation/login-name';
import {
  validateEmployeeCanLogin,
  verifyMockPassword,
} from '@/lib/employee-auth/employee-auth-service';
import { checkLoginUsernameStatus } from '@/lib/employee-auth/check-login-username';
import {
  loginWrongPasswordMessage,
  mapAuthError,
  mapLoginUsernameStatus,
} from '@/lib/employee-auth/login-errors';
import { isApi } from '@/lib/data/config';
import { signIn } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import { clearStoredApiToken } from '@/lib/api/client';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';
import { getEmployeeByLoginName } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import type { User } from '@/types';

const MOCK_AUTH_PREFIX = 'auth-';

export interface LoginWithUsernameInput {
  username: string;
  password: string;
  /** "Ghi nhớ đăng nhập" — mặc định bật. Tắt thì phiên chỉ sống trong phiên trình duyệt. */
  remember?: boolean;
}

export type LoginWithUsernameResult =
  | { ok: true; user: User; mustChangePassword: boolean }
  | { ok: false; error: string };

async function resolvePreLoginBlockReason(username: string): Promise<string | null> {
  if (isApi()) return null;
  const status = await checkLoginUsernameStatus(username);
  if (status === 'ok') return null;
  return mapLoginUsernameStatus(status);
}

function applyApiSuperGrants(capBac: number | null | undefined): void {
  usePermissionGrantStore.getState().setMatrixGrants({}, capBac ?? null);
}

/**
 * Auth.js set cookie phiên kèm `expires` cố định. Khi người dùng bỏ tick "Ghi nhớ",
 * gọi route này để hạ cookie xuống cookie phiên (đóng trình duyệt là mất).
 */
async function applySessionPersistence(remember: boolean): Promise<void> {
  if (remember) return;
  try {
    await fetch('/api/auth/remember', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remember: false }),
      credentials: 'same-origin',
    });
  } catch {
    // Không chặn đăng nhập: JWT vẫn có hạn ngắn theo resolveSessionMaxAge().
  }
}

/** Đăng nhập bằng tên đăng nhập + mật khẩu (mock hoặc Auth.js + Postgres). */
export async function loginWithUsername(
  input: LoginWithUsernameInput,
): Promise<LoginWithUsernameResult> {
  const username = normalizeLoginName(input.username);
  const authEmail = loginNameToAuthEmail(username);

  const preLoginBlock = await resolvePreLoginBlockReason(username);
  if (preLoginBlock) {
    return { ok: false, error: preLoginBlock };
  }

  const remember = input.remember !== false;

  if (isApi()) {
    try {
      clearStoredApiToken();
      const result = await signIn('credentials', {
        tai_khoan: username,
        password: input.password,
        remember: String(remember),
        redirect: false,
      });
      if (result?.error) {
        return { ok: false, error: mapAuthError(result.error, result.code) };
      }
      await applySessionPersistence(remember);
      const session = await getSession();
      const user = session?.user;
      if (!user?.employee_id) {
        return { ok: false, error: loginWrongPasswordMessage() };
      }
      applyApiSuperGrants(user.cap_bac ?? null);
      return {
        ok: true,
        user,
        mustChangePassword: user.must_change_password ?? false,
      };
    } catch (err) {
      clearStoredApiToken();
      const message = err instanceof Error ? mapAuthError(err.message) : loginWrongPasswordMessage();
      return { ok: false, error: message };
    }
  }

  const employee = await getEmployeeByLoginName(username);
  if (!employee) {
    return { ok: false, error: mapLoginUsernameStatus('not_found') };
  }
  const blockReason = validateEmployeeCanLogin(employee);
  if (blockReason) return { ok: false, error: blockReason };
  if (!verifyMockPassword(username, input.password)) {
    return { ok: false, error: loginWrongPasswordMessage() };
  }

  const authUserId = `${MOCK_AUTH_PREFIX}${employee.id}`;
  const user: User = {
    id: authUserId,
    employee_id: employee.id,
    email: authEmail,
    ten_dang_nhap: employee.ten_dang_nhap ?? username,
    full_name: employee.ho_ten,
    avatar_url: employee.anh_dai_dien,
    role: 'user',
    created_at: employee.tg_tao ?? new Date().toISOString(),
    id_phong_ban: employee.phong_ban_id ?? undefined,
    id_chuc_vu: employee.chuc_vu_id ? [employee.chuc_vu_id] : undefined,
    must_change_password: employee.must_change_password ?? false,
    tai_khoan_dang_hoat_dong: employee.tai_khoan_dang_hoat_dong ?? true,
  };

  return {
    ok: true,
    user,
    mustChangePassword: user.must_change_password ?? false,
  };
}
