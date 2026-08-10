import { describe, expect, it } from 'vitest';
import { buildEmployeePredicate } from './nhan-vien-list-query';
import type { SheetNhanVienRow } from './nhan-vien';

function row(overrides: Partial<SheetNhanVienRow> = {}): SheetNhanVienRow {
  return {
    id: '1',
    ho_va_ten: 'Nguyễn Văn An',
    hinh_anh: null,
    trang_thai: 'ACTIVE',
    id_chuc_vu: null,
    id_phong_ban: null,
    mat_khau: 'hash',
    must_change_password: false,
    role: 'user',
    email: '',
    cap: null,
    ten_dang_nhap: '',
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

  it('matches search across name/id', () => {
    const predicate = buildEmployeePredicate({ search: 'nguyễn văn an' });
    expect(predicate(row())).toBe(true);
    expect(predicate(row({ ho_va_ten: 'Trần Thị B' }))).toBe(false);
  });

  it('omits one dimension for exclude-self counts', () => {
    const predicate = buildEmployeePredicate({ trang_thai: ['Nghỉ việc'] }, 'trang_thai');
    expect(predicate(row({ trang_thai: 'INACTIVE' }))).toBe(true);
  });

  it('ANDs multiple filters via columnSearch', () => {
    const predicate = buildEmployeePredicate({ columnSearch: { id: '1' } });
    expect(predicate(row())).toBe(true);
    expect(predicate(row({ id: '2' }))).toBe(false);
  });
});
