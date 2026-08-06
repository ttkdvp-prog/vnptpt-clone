import { loginNameToAuthEmail } from '@/lib/auth-email';
import { isApi, isMock } from '@/lib/data/config';
import { ApiError } from '@/lib/api/client';
import { apiChangePassword, apiSetPassword } from '@/lib/api/he-thong';
import { normalizeLoginName } from '@/lib/validation/login-name';
import {
  setMockPassword,
  verifyMockPassword,
} from '@/lib/employee-auth/employee-auth-service';
import { txt } from '@/lib/text';

export type ChangePasswordInput = {
  loginName: string;
  currentPassword: string;
  newPassword: string;
  /** Auth email; defaults to loginNameToAuthEmail(loginName). */
  authEmail?: string;
};

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

function mapApiPasswordError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return txt('page.profile.wrongCurrentPassword');
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return txt('page.profile.passwordChangeFailed');
}

/** Voluntary change: verify current password, then set new password. */
export async function changePassword(
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  const loginName = normalizeLoginName(input.loginName);
  if (!loginName) {
    return { ok: false, error: txt('page.profile.noLoginName') };
  }

  if (isMock()) {
    if (!verifyMockPassword(loginName, input.currentPassword)) {
      return { ok: false, error: txt('page.profile.wrongCurrentPassword') };
    }
    setMockPassword(loginName, input.newPassword);
    return { ok: true };
  }

  if (isApi()) {
    try {
      await apiChangePassword(input.currentPassword, input.newPassword);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapApiPasswordError(err) };
    }
  }

  return { ok: false, error: txt('page.profile.dataSourceUnsupported') };
}

/** First-login / HR reset: set new password without verifying the old one. */
export async function setNewPasswordWithoutCurrent(
  newPassword: string,
  loginName?: string,
): Promise<ChangePasswordResult> {
  if (isMock()) {
    const name = loginName ? normalizeLoginName(loginName) : '';
    if (name) setMockPassword(name, newPassword);
    return { ok: true };
  }

  if (isApi()) {
    try {
      await apiSetPassword(newPassword);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mapApiPasswordError(err) };
    }
  }

  return { ok: false, error: txt('page.profile.dataSourceUnsupported') };
}

/** Resolve auth email from session user fields. */
export function resolveUserAuthEmail(user: {
  email?: string | null;
  ten_dang_nhap?: string | null;
}): string {
  if (user.ten_dang_nhap?.trim()) {
    return loginNameToAuthEmail(user.ten_dang_nhap);
  }
  return user.email?.trim() ?? '';
}

export function resolveUserLoginName(user: {
  email?: string | null;
  ten_dang_nhap?: string | null;
}): string {
  if (user.ten_dang_nhap?.trim()) {
    return normalizeLoginName(user.ten_dang_nhap);
  }
  const email = user.email?.trim() ?? '';
  if (!email) return '';
  return normalizeLoginName(email.split('@')[0] ?? '');
}
