import type { EmployeeAuthAction } from '@/lib/employee-auth/constants';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import type { User } from '@/types';

export interface EmployeeAuthPayload {
  action: EmployeeAuthAction;
  employee_id: string;
  password?: string;
  ho_ten?: string;
  trang_thai?: string;
}

export interface EmployeeAuthResult {
  auth_user_id?: string;
  must_change_password?: boolean;
  tai_khoan_dang_hoat_dong?: boolean;
}

/** Map Auth.js / mock session + employee row → app User. */
export function buildAppUserFromSession(
  authUserId: string,
  authEmail: string,
  employee: Employee,
  meta?: Record<string, unknown>,
): User {
  return {
    id: authUserId,
    employee_id: employee.id,
    email: authEmail,
    full_name: (meta?.full_name as string | undefined) ?? employee.ho_ten,
    avatar_url: employee.anh_dai_dien ?? undefined,
    role: 'user',
    created_at: new Date().toISOString(),
    must_change_password: employee.must_change_password ?? false,
    tai_khoan_dang_hoat_dong: employee.tai_khoan_dang_hoat_dong ?? true,
  };
}

export function buildAuthEmailPreview(employeeId: string): string {
  return `${employeeId}@local`;
}

export function buildAuthUserMetadata(employee: Employee): Record<string, unknown> {
  return {
    employee_id: employee.id,
    full_name: employee.ho_ten,
  };
}
