import { describe, expect, it } from 'vitest';
import { registerModuleStrings } from '@/lib/text/register-module-strings';
import { employee as employeeStrings } from '@/features/he-thong/nhan-vien/text';
import {
  buildEmployeeProfileDocModel,
  pairProfileRows,
  type CompanyDocInfo,
  type ProfileDocRow,
} from '../profile-document-model';
import type { Employee } from '../types';

registerModuleStrings('employee', employeeStrings);

const COMPANY: CompanyDocInfo = {
  companyName: 'Công ty TNHH An Hưng Thịnh',
  address: 'Số 1 Đường Mẫu',
  email: 'contact@company.vn',
  phone: '028 1234 5678',
  logo: null,
};

const FORMATTERS = { date: (iso: string) => `D(${iso})` };
const PRINTED_AT = '05/08/2026 14:20';

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: '7',
    ho_ten: 'Nguyễn Văn A',
    email: '',
    so_dien_thoai: '',
    phong_ban_id: null,
    chuc_vu_id: null,
    gioi_tinh: 'Nam',
    trang_thai: 'Đang làm việc',
    ...overrides,
  };
}

function allRows(model: ReturnType<typeof buildEmployeeProfileDocModel>): ProfileDocRow[] {
  return model.sections.flatMap((s) => s.rows);
}

describe('buildEmployeeProfileDocModel', () => {
  it('bỏ dòng trống và bỏ luôn section rỗng theo mặc định', () => {
    const model = buildEmployeeProfileDocModel(
      makeEmployee(),
      COMPANY,
      PRINTED_AT,
      FORMATTERS,
    );

    expect(allRows(model).every((r) => r.value !== '')).toBe(true);
    expect(allRows(model).some((r) => r.value === '—')).toBe(false);
    // hồ sơ chỉ có giới tính + trạng thái → không được sinh section ngân hàng / bảo hiểm / địa chỉ
    expect(model.sections.map((s) => s.key)).not.toContain('financial');
    expect(model.sections.map((s) => s.key)).not.toContain('insurance');
    expect(model.sections.map((s) => s.key)).not.toContain('address');
  });

  it('includeEmpty giữ toàn bộ dòng và điền dấu gạch (dùng cho Excel)', () => {
    const model = buildEmployeeProfileDocModel(
      makeEmployee(),
      COMPANY,
      PRINTED_AT,
      FORMATTERS,
      { includeEmpty: true },
    );

    expect(model.sections.map((s) => s.key)).toContain('insurance');
    expect(allRows(model).some((r) => r.value === '—')).toBe(true);
  });

  it('dùng formatter được truyền vào cho mọi trường ngày', () => {
    const model = buildEmployeeProfileDocModel(
      makeEmployee({ ngay_sinh: '1990-04-15', ngay_vao_lam: '2019-03-01' }),
      COMPANY,
      PRINTED_AT,
      FORMATTERS,
    );

    const values = allRows(model).map((r) => r.value);
    expect(values).toContain('D(1990-04-15)');
    expect(values).toContain('D(2019-03-01)');
  });

  it('đánh dấu wide cho các trường dài', () => {
    const model = buildEmployeeProfileDocModel(
      makeEmployee({
        dia_chi_thuong_tru: '123 Nguyễn Thị Minh Khai, Quận 1',
        truong: 'Trường Đại học Kinh tế TP. HCM',
        ly_do_nghi: 'Hết hợp đồng',
      }),
      COMPANY,
      PRINTED_AT,
      FORMATTERS,
    );

    const wideValues = allRows(model)
      .filter((r) => r.wide)
      .map((r) => r.value);
    expect(wideValues).toContain('123 Nguyễn Thị Minh Khai, Quận 1');
    expect(wideValues).toContain('Trường Đại học Kinh tế TP. HCM');
    expect(wideValues).toContain('Hết hợp đồng');
  });

  it('dịch nhãn trạng thái và giới tính, không trả giá trị thô của DB', () => {
    const model = buildEmployeeProfileDocModel(
      makeEmployee({ trang_thai: 'Thử việc', gioi_tinh: 'Nữ', ten_chuc_vu: 'Kế toán' }),
      COMPANY,
      PRINTED_AT,
      FORMATTERS,
    );

    expect(model.heading.role).toBe('Kế toán · Thử việc');
    expect(allRows(model).map((r) => r.value)).toContain('Nữ');
  });

  it('đưa họ tên và mã NV lên khối định danh, không lặp lại trong section', () => {
    const model = buildEmployeeProfileDocModel(makeEmployee(), COMPANY, PRINTED_AT, FORMATTERS);

    expect(model.heading.name).toBe('Nguyễn Văn A');
    expect(model.heading.code).toBe('7');
    expect(allRows(model).map((r) => r.value)).not.toContain('Nguyễn Văn A');
  });

  it('không tự gọi Date — printedAt lấy đúng giá trị truyền vào', () => {
    const model = buildEmployeeProfileDocModel(makeEmployee(), COMPANY, PRINTED_AT, FORMATTERS);
    expect(model.printedAt).toBe(PRINTED_AT);
  });
});

describe('pairProfileRows', () => {
  const row = (label: string, wide = false): ProfileDocRow => ({ label, value: label, wide });

  it('ghép 2 dòng thường thành một hàng', () => {
    expect(pairProfileRows([row('a'), row('b'), row('c'), row('d')])).toHaveLength(2);
  });

  it('dòng wide luôn đứng riêng và không cuỗm mất dòng đang chờ', () => {
    const pairs = pairProfileRows([row('a'), row('w', true), row('b'), row('c')]);
    expect(pairs.map((p) => p.map((r) => r.label))).toEqual([['a'], ['w'], ['b', 'c']]);
  });

  it('dòng lẻ cuối cùng vẫn được giữ', () => {
    const pairs = pairProfileRows([row('a'), row('b'), row('c')]);
    expect(pairs.map((p) => p.map((r) => r.label))).toEqual([
      ['a', 'b'],
      ['c'],
    ]);
  });
});
