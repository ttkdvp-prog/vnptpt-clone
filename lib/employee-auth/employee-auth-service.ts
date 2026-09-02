import { isApi, isMock } from '@/lib/data/config';
import type { EmployeeAuthResult } from '@/lib/employee-auth/session';
import { shouldDisableAuthForStatus } from '@/lib/employee-auth/constants';
import { txt } from '@/lib/text';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { getErrorMessage } from '@/lib/utils';

/** Mock-only: lưu mật khẩu tạm theo employee id (dev/demo). */
const mockPasswords = new Map<string, string>();

export function setMockPassword(employeeId: string, password: string): void {
  mockPasswords.set(employeeId, password);
}

export function verifyMockPassword(employeeId: string, password: string): boolean {
  const stored = mockPasswords.get(employeeId);
  if (stored !== undefined) return stored === password;
  return password.length >= 1;
}

export async function resetEmployeeAuthPassword(
  employee: Employee,
  password: string,
): Promise<EmployeeAuthResult> {
  if (isMock()) {
    setMockPassword(employee.id, password);
    return { must_change_password: true };
  }
  if (isApi()) {
    throw new Error('Employee auth được xử lý qua API Auth.js — không gọi hàm này trực tiếp.');
  }
  throw new Error('Nguồn dữ liệu không hỗ trợ employee auth.');
}

export async function setEmployeeAuthActive(_employee: Employee, _active: boolean): Promise<void> {
  // API mode: trạng thái tài khoản theo dõi qua `trang_thai` nhân viên, không cần bước riêng.
  // Mock mode: không có bảng auth riêng để bật/tắt.
}

export function validateEmployeeCanLogin(employee: Employee): string | null {
  if (shouldDisableAuthForStatus(employee.trang_thai)) {
    return txt('page.login.employeeResigned');
  }
  return null;
}

export { getErrorMessage };
