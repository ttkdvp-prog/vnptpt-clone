import { describe, expect, it } from 'vitest';
import { buildEmployeePredicate } from './nhan-vien-list-query';
import type { SheetNhanVienRow } from './nhan-vien';

function row(overrides: Partial<SheetNhanVienRow> = {}): SheetNhanVienRow {
  return {
    id: 1,
    ho_va_ten: 'Nguyễn Văn An',
    hinh_anh: null,
    email: 'an@example.com',
    email_ca_nhan: null,
    so_dien_thoai: '0900000000',
    gioi_tinh: 'Nam',
    ngay_sinh: null,
    so_cccd: null,
    ngay_cap_cccd: null,
    noi_cap_cccd: null,
    dia_chi_thuong_tru: null,
    dia_chi_hien_tai: null,
    que_quan: null,
    dan_toc: null,
    ton_giao: null,
    tinh_trang_hon_nhan: null,
    quoc_tich: null,
    ngay_vao_lam: null,
    ngay_chinh_thuc: null,
    ngay_nghi_viec: null,
    ly_do_nghi: null,
    so_tai_khoan: null,
    ten_chu_tai_khoan: null,
    ngan_hang: null,
    chi_nhanh: null,
    nguoi_lien_he_khan: null,
    sdt_khan: null,
    moi_quan_he: null,
    so_so_bhxh: null,
    so_bhyt: null,
    ma_so_thue_ca_nhan: null,
    trinh_do: null,
    chuyen_nganh: null,
    truong: null,
    trang_thai: 'ACTIVE',
    id_chuc_vu: 1,
    id_phong_ban: 2,
    cap_bac: 1,
    tai_khoan: 'annv',
    mat_khau: 'hash',
    must_change_password: false,
    nguoi_tao: null,
    tg_tao: new Date('2026-01-15'),
    tg_cap_nhat: new Date('2026-01-15'),
    ten_chuc_vu: 'Nhân viên',
    ten_phong_ban: 'Kinh doanh',
    ...overrides,
  };
}

describe('buildEmployeePredicate', () => {
  it('matches everything with no filters', () => {
    expect(buildEmployeePredicate({})(row())).toBe(true);
  });

  it('maps app status labels to DB tokens', () => {
    const predicate = buildEmployeePredicate({ trang_thai: ['Đang làm việc'] });
    expect(predicate(row({ trang_thai: 'ACTIVE' }))).toBe(true);
    expect(predicate(row({ trang_thai: 'PROBATION' }))).toBe(false);
  });

  it('matches search across name/email/phone/dept/position', () => {
    const predicate = buildEmployeePredicate({ search: 'kinh doanh' });
    expect(predicate(row())).toBe(true);
    expect(predicate(row({ ten_phong_ban: 'Nhân sự' }))).toBe(false);
  });

  it('omits one dimension for exclude-self counts', () => {
    const predicate = buildEmployeePredicate(
      { trang_thai: ['Nghỉ việc'], phong_ban_id: ['999'] },
      'phong_ban_id',
    );
    expect(predicate(row({ trang_thai: 'INACTIVE', id_phong_ban: 2 }))).toBe(true);
  });

  it('ANDs multiple filters', () => {
    const predicate = buildEmployeePredicate({ gioi_tinh: ['Nam'], phong_ban_id: ['2'] });
    expect(predicate(row())).toBe(true);
    expect(predicate(row({ gioi_tinh: 'Nữ' }))).toBe(false);
    expect(predicate(row({ id_phong_ban: 3 }))).toBe(false);
  });
});
