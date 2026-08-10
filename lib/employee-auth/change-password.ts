import { isApi, isMock } from '@/lib/data/config';
import { ApiError } from '@/lib/api/client';
import { apiChangePassword, apiSetPassword } from '@/lib/api/he-thong';
import {
  setMockPassword,
  verifyMockPassword,
} from '@/lib/employee-auth/employee-auth-service';
import { txt } from '@/lib/text';

export type ChangePasswordInput = {
  employeeId: string;
  currentPassword: string;
  newPassword: string;
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
  if (isMock()) {
    if (!verifyMockPassword(input.employeeId, input.currentPassword)) {
      return { ok: false, error: txt('page.profile.wrongCurrentPassword') };
    }
    setMockPassword(input.employeeId, input.newPassword);
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
  employeeId?: string,
): Promise<ChangePasswordResult> {
  if (isMock()) {
    if (employeeId) setMockPassword(employeeId, newPassword);
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
