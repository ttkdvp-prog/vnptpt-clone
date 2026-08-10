// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { employeeToFormValues } from '@/features/he-thong/nhan-vien/utils/employee-to-form';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { classifyEmployeeUpdate, EMPLOYEE_FIELD_TIERS } from './nhan-vien-fields';

/** Hồ sơ đầy đủ, sát dữ liệu thật (findEmployeeById trả app-shaped như thế này). */
const employee: Employee = {
  id: '7',
  ho_ten: 'Nguyễn Văn A',
  must_change_password: false,
  trang_thai: 'Đang làm việc',
  anh_dai_dien: '/uploads/a.webp',
};

/**
 * Dựng lại ĐÚNG payload mà `nhan-vien-service.updateEmployee` (nhánh isApi) gửi:
 * toàn bộ form. Đây là mặt tương thích quan trọng nhất — nếu diff sai một
 * trường, nhân viên thường mất quyền đổi ảnh đại diện.
 */
function buildApiPayload(overrides: Record<string, unknown> = {}) {
  const form = employeeToFormValues(employee);
  return {
    ...form,
    mat_khau_tam: undefined,
    ...overrides,
  };
}

describe('self-service không bị vỡ (hồi quy quan trọng nhất)', () => {
  it('gửi lại nguyên hồ sơ + đổi ảnh ⇒ KHÔNG cần quyền gì', () => {
    const result = classifyEmployeeUpdate(
      buildApiPayload({ anh_dai_dien: '/uploads/moi.webp' }),
      employee,
    );
    expect(result.requiresSua).toEqual([]);
    expect(result.requiresAdmin).toEqual([]);
    expect(result.carriesPassword).toBe(false);
  });

  it('gửi lại nguyên hồ sơ, không đổi gì ⇒ KHÔNG cần quyền gì', () => {
    const result = classifyEmployeeUpdate(buildApiPayload(), employee);
    expect(result.requiresSua).toEqual([]);
    expect(result.requiresAdmin).toEqual([]);
  });
});

describe('trường tầng ADMIN', () => {
  it('must_change_password lật giá trị ⇒ requiresAdmin; giữ nguyên ⇒ không', () => {
    expect(
      classifyEmployeeUpdate({ must_change_password: true }, employee).requiresAdmin,
    ).toContain('must_change_password');
    expect(
      classifyEmployeeUpdate({ must_change_password: false }, employee).requiresAdmin,
    ).toEqual([]);
  });
});

describe('mật khẩu', () => {
  it('mat_khau_tam non-empty ⇒ carriesPassword', () => {
    expect(classifyEmployeeUpdate({ mat_khau_tam: 'abc123' }, employee).carriesPassword).toBe(
      true,
    );
  });

  it('alias mat_khau cũng tính', () => {
    expect(classifyEmployeeUpdate({ mat_khau: 'abc123' }, employee).carriesPassword).toBe(true);
  });

  it('rỗng / khoảng trắng / undefined ⇒ KHÔNG tính', () => {
    expect(classifyEmployeeUpdate({ mat_khau_tam: '' }, employee).carriesPassword).toBe(false);
    expect(classifyEmployeeUpdate({ mat_khau_tam: '   ' }, employee).carriesPassword).toBe(false);
    expect(classifyEmployeeUpdate({ mat_khau_tam: undefined }, employee).carriesPassword).toBe(
      false,
    );
  });
});

describe('trường tầng SUA', () => {
  it('đổi ho_ten ⇒ requiresSua', () => {
    const result = classifyEmployeeUpdate(
      buildApiPayload({ ho_ten: 'Tên Mới' }),
      employee,
    );
    expect(result.requiresSua).toContain('ho_ten');
    expect(result.requiresAdmin).toEqual([]);
  });

  it('đổi trang_thai ⇒ requiresSua (không phải admin)', () => {
    const result = classifyEmployeeUpdate(
      buildApiPayload({ trang_thai: 'Nghỉ việc' }),
      employee,
    );
    expect(result.requiresSua).toContain('trang_thai');
    expect(result.requiresAdmin).toEqual([]);
  });

  it("'' và null coi như nhau — không tính là đổi", () => {
    const result = classifyEmployeeUpdate({ ho_ten: employee.ho_ten }, employee);
    expect(result.requiresSua).toEqual([]);
  });
});

describe('bảng phân tầng chỉ còn field thật của sheet', () => {
  it('không có field phòng ban/chức vụ/cấp bậc/tài khoản', () => {
    expect(EMPLOYEE_FIELD_TIERS.phong_ban_id).toBeUndefined();
    expect(EMPLOYEE_FIELD_TIERS.chuc_vu_id).toBeUndefined();
    expect(EMPLOYEE_FIELD_TIERS.cap_bac).toBeUndefined();
    expect(EMPLOYEE_FIELD_TIERS.ten_dang_nhap).toBeUndefined();
  });
});
