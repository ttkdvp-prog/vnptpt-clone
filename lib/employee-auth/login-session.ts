import {
  validateEmployeeCanLogin,
  verifyMockPassword,
} from '@/lib/employee-auth/employee-auth-service';
import { getEmployeeAuthStatus } from '@/lib/employee-auth/check-login-username';
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
import { findEmployeeById } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import type { User } from '@/types';

const MOCK_AUTH_PREFIX = 'auth-';

export interface LoginWithUsernameInput {
  /** Mã nhân viên (số) — login không còn dùng tên đăng nhập. */
  employeeId: string;
  password: string;
  /** "Ghi nhớ đăng nhập" — mặc định bật. Tắt thì phiên chỉ sống trong phiên trình duyệt. */
  remember?: boolean;
}

export type LoginWithUsernameResult =
  | { ok: true; user: User; mustChangePassword: boolean }
  | { ok: false; error: string };

async function resolvePreLoginBlockReason(employeeId: string): Promise<string | null> {
  if (isApi()) return null;
  const status = await getEmployeeAuthStatus(employeeId);
  if (status === 'ok') return null;
  return mapLoginUsernameStatus(status);
}

function applyApiSuperGrants(): void {
  usePermissionGrantStore.getState().setMatrixGrants({}, null);
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

/** Đăng nhập bằng mã nhân viên + mật khẩu (mock hoặc Auth.js + Google Sheets). */
export async function loginWithUsername(
  input: LoginWithUsernameInput,
): Promise<LoginWithUsernameResult> {
  const employeeId = input.employeeId.trim();
  const authEmail = `${employeeId}@local`;

  const preLoginBlock = await resolvePreLoginBlockReason(employeeId);
  if (preLoginBlock) {
    return { ok: false, error: preLoginBlock };
  }

  const remember = input.remember !== false;

  if (isApi()) {
    try {
      clearStoredApiToken();
      const result = await signIn('credentials', {
        id: employeeId,
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
      applyApiSuperGrants();
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

  const employee = await findEmployeeById(employeeId);
  if (!employee) {
    return { ok: false, error: mapLoginUsernameStatus('not_found') };
  }
  const blockReason = validateEmployeeCanLogin(employee);
  if (blockReason) return { ok: false, error: blockReason };
  if (!verifyMockPassword(employeeId, input.password)) {
    return { ok: false, error: loginWrongPasswordMessage() };
  }

  const authUserId = `${MOCK_AUTH_PREFIX}${employee.id}`;
  const user: User = {
    id: authUserId,
    employee_id: employee.id,
    email: authEmail,
    full_name: employee.ho_ten,
    avatar_url: employee.anh_dai_dien ?? undefined,
    role: 'user',
    created_at: new Date().toISOString(),
    must_change_password: employee.must_change_password ?? false,
    tai_khoan_dang_hoat_dong: employee.tai_khoan_dang_hoat_dong ?? true,
  };

  return {
    ok: true,
    user,
    mustChangePassword: user.must_change_password ?? false,
  };
}
