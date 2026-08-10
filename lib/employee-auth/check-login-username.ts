import { shouldDisableAuthForStatus } from '@/lib/employee-auth/constants';
import type { LoginUsernameStatus } from '@/lib/employee-auth/login-errors';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { findEmployeeById } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

export function resolveLoginUsernameStatusFromEmployee(
  employee: Employee | null | undefined,
): LoginUsernameStatus {
  if (!employee) return 'not_found';
  if (employee.tai_khoan_dang_hoat_dong === false) return 'inactive';
  if (shouldDisableAuthForStatus(employee.trang_thai)) return 'resigned';
  return 'ok';
}

/** Pre-login check theo mã nhân viên via employee service (mock / API). */
export async function getEmployeeAuthStatus(employeeId: string): Promise<LoginUsernameStatus> {
  const trimmed = employeeId.trim();
  if (!trimmed) return 'not_found';

  const employee = await findEmployeeById(trimmed);
  return resolveLoginUsernameStatusFromEmployee(employee);
}
