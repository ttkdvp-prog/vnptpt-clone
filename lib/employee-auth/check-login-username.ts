import { shouldDisableAuthForStatus } from '@/lib/employee-auth/constants';
import type { LoginUsernameStatus } from '@/lib/employee-auth/login-errors';
import { normalizeLoginName } from '@/lib/validation/login-name';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { getEmployeeByLoginName } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

export function resolveLoginUsernameStatusFromEmployee(
  employee: Employee | null | undefined,
): LoginUsernameStatus {
  if (!employee) return 'not_found';
  if (employee.tai_khoan_dang_hoat_dong === false) return 'inactive';
  if (shouldDisableAuthForStatus(employee.trang_thai)) return 'resigned';
  return 'ok';
}

/** Pre-login username check via employee service (mock / API). */
export async function checkLoginUsernameStatus(
  loginName: string,
): Promise<LoginUsernameStatus> {
  const normalized = normalizeLoginName(loginName);
  if (!normalized) return 'not_found';

  const employee = await getEmployeeByLoginName(normalized);
  return resolveLoginUsernameStatusFromEmployee(employee);
}
