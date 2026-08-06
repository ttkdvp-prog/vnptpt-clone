// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { employeeToFormValues } from '@/features/he-thong/nhan-vien/utils/employee-to-form';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { classifyEmployeeUpdate, EMPLOYEE_FIELD_TIERS } from './nhan-vien-fields';

/** Hồ sơ đầy đủ, sát dữ liệu thật (findEmployeeById trả app-shaped như thế này). */
const employee = {
  id: '7',
  ho_ten: 'Nguyễn Văn A',
  email: 'a@congty.vn',
  email_ca_nhan: 'a@gmail.com',
  so_dien_thoai: '0901234567',
  ten_dang_nhap: 'nguyenvana',
  must_change_password: false,
  phong_ban_id: '3',
  chuc_vu_id: '10',
  cap_bac: 4,
  trang_thai: 'Đang làm việc',
  gioi_tinh: 'Nam',
  ngay_sinh: '1990-01-01',
  so_cccd: '012345678901',
  ngay_cap_cccd: '2020-01-01',
  noi_cap_cccd: 'Cục CS QLHC về TTXH',
  dia_chi_thuong_tru: '1 Lê Lợi, Bến Nghé, TP.HCM',
  dia_chi_hien_tai: null,
  que_quan: 'Hà Nội',
  dan_toc: 'Kinh',
  ton_giao: 'Không',
  tinh_trang_hon_nhan: 'Độc thân',
  quoc_tich: 'Việt Nam',
  ngay_vao_lam: '2021-03-01',
  ngay_chinh_thuc: '2021-06-01',
  ngay_nghi_viec: null,
  ly_do_nghi: null,
  so_tai_khoan: '0123456789',
  ten_chu_tai_khoan: 'NGUYEN VAN A',
  ngan_hang: 'Vietcombank',
  chi_nhanh: 'Sở Giao Dịch',
  nguoi_lien_he_khan: 'Nguyễn Thị B',
  sdt_khan: '0909999999',
  moi_quan_he: 'Vợ',
  so_so_bhxh: '0123456789',
  so_bhyt: 'HS4012345678901',
  ma_so_thue_ca_nhan: '8012345678',
  trinh_do: 'Đại học',
  chuyen_nganh: 'Công nghệ thông tin',
  truong: 'Đại học Bách Khoa',
  anh_dai_dien: '/uploads/a.webp',
  nguoi_tao: '1',
} as unknown as Employee;

/**
 * Dựng lại ĐÚNG payload mà `nhan-vien-service.updateEmployee` (nhánh isApi) gửi:
 * toàn bộ form + ten_dang_nhap + cap_bac cũ. Đây là mặt tương thích quan trọng
 * nhất — nếu diff sai một trường, nhân viên thường mất quyền đổi ảnh đại diện.
 */
function buildApiPayload(overrides: Record<string, unknown> = {}) {
  const form = employeeToFormValues(employee);
  return {
    ...form,
    ten_dang_nhap: employee.ten_dang_nhap,
    mat_khau_tam: undefined,
    phong_ban_id: form.phong_ban_id ?? null,
    chuc_vu_id: form.chuc_vu_id ?? null,
    cap_bac: employee.cap_bac ?? null,
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

  it('đổi các trường SELF khác (SĐT, email cá nhân, liên hệ khẩn) ⇒ không cần quyền', () => {
    const result = classifyEmployeeUpdate(
      buildApiPayload({
        so_dien_thoai: '0987654321',
        email_ca_nhan: 'moi@gmail.com',
        dia_chi_hien_tai: '99 Nguyễn Huệ',
        sdt_khan: '0911111111',
      }),
      employee,
    );
    expect(result.requiresSua).toEqual([]);
    expect(result.requiresAdmin).toEqual([]);
  });
});

describe('cap_bac bị bỏ qua hoàn toàn (đóng đường leo quyền)', () => {
  it('cap_bac: 1 không bao giờ xuất hiện trong yêu cầu quyền', () => {
    const result = classifyEmployeeUpdate(buildApiPayload({ cap_bac: 1 }), employee);
    expect(result.requiresAdmin).not.toContain('cap_bac');
    expect(result.requiresSua).not.toContain('cap_bac');
    expect(result.requiresAdmin).toEqual([]);
    expect(result.requiresSua).toEqual([]);
  });

  it('cap_bac không có trong bảng phân tầng — nó được suy ra, không phải chặn', () => {
    expect(EMPLOYEE_FIELD_TIERS.cap_bac).toBeUndefined();
    expect(EMPLOYEE_FIELD_TIERS.nguoi_tao).toBeUndefined();
  });
});

describe('trường tầng ADMIN', () => {
  it('đổi chuc_vu_id ⇒ requiresAdmin (đây là vector escalation còn lại)', () => {
    const result = classifyEmployeeUpdate(buildApiPayload({ chuc_vu_id: '99' }), employee);
    expect(result.requiresAdmin).toContain('chuc_vu_id');
  });

  it('đổi ten_dang_nhap ⇒ requiresAdmin', () => {
    const result = classifyEmployeeUpdate(
      buildApiPayload({ ten_dang_nhap: 'nguoikhac' }),
      employee,
    );
    expect(result.requiresAdmin).toContain('ten_dang_nhap');
  });

  it('ten_dang_nhap khác hoa/thường + khoảng trắng ⇒ KHÔNG tính là đổi', () => {
    const result = classifyEmployeeUpdate(
      buildApiPayload({ ten_dang_nhap: '  NguyenVanA  ' }),
      employee,
    );
    expect(result.requiresAdmin).toEqual([]);
  });

  it('alias tai_khoan cũng được quy về ten_dang_nhap', () => {
    const result = classifyEmployeeUpdate({ tai_khoan: 'nguoikhac' }, employee);
    expect(result.requiresAdmin).toContain('ten_dang_nhap');
  });

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
  it('đổi ho_ten / CCCD / ngân hàng ⇒ requiresSua', () => {
    const result = classifyEmployeeUpdate(
      buildApiPayload({ ho_ten: 'Tên Mới', so_cccd: '999999999999' }),
      employee,
    );
    expect(result.requiresSua).toContain('ho_ten');
    expect(result.requiresSua).toContain('so_cccd');
    expect(result.requiresAdmin).toEqual([]);
  });

  it('đổi trang_thai / phong_ban_id ⇒ requiresSua (không phải admin)', () => {
    const result = classifyEmployeeUpdate(
      buildApiPayload({ trang_thai: 'Nghỉ việc', phong_ban_id: '5' }),
      employee,
    );
    expect(result.requiresSua).toEqual(expect.arrayContaining(['trang_thai', 'phong_ban_id']));
    expect(result.requiresAdmin).toEqual([]);
  });

  it("'' và null coi như nhau — không tính là đổi", () => {
    const result = classifyEmployeeUpdate(
      { ly_do_nghi: '', ngay_nghi_viec: null, dia_chi_hien_tai: '' },
      employee,
    );
    expect(result.requiresSua).toEqual([]);
  });

  it('null → có giá trị (xoá dữ liệu) VẪN tính là đổi', () => {
    const result = classifyEmployeeUpdate({ que_quan: null }, employee);
    expect(result.requiresSua).toContain('que_quan');
  });
});
