import { describe, expect, it } from 'vitest';
import { phieuHanhChinhSchema } from '../schema';

const base = {
  ma_phieu: 'XN',
  id_nhan_vien: '2',
  tu_ngay: '2026-07-10',
  buoi_bat_dau: 'sang',
  den_ngay: '2026-07-10',
  buoi_ket_thuc: 'chieu',
};

describe('phieuHanhChinhSchema', () => {
  it('accepts valid phiếu with dem shift and times', () => {
    const parsed = phieuHanhChinhSchema.parse({
      ...base,
      buoi_bat_dau: 'dem',
      buoi_ket_thuc: 'dem',
      gio_bat_dau: '22:00',
      gio_ket_thuc: '06:00',
      ly_do: 'Điều chỉnh công ca đêm',
      hinh_anh: ['https://example.com/a.jpg'],
    });
    expect(parsed.buoi_bat_dau).toBe('dem');
    expect(parsed.gio_bat_dau).toBe('22:00');
    expect(parsed.hinh_anh).toEqual(['https://example.com/a.jpg']);
  });

  it('nulls empty optional fields', () => {
    const parsed = phieuHanhChinhSchema.parse({
      ...base,
      ly_do: '  ',
      gio_bat_dau: '',
      gio_ket_thuc: null,
    });
    expect(parsed.ly_do).toBeNull();
    expect(parsed.gio_bat_dau).toBeNull();
    expect(parsed.gio_ket_thuc).toBeNull();
  });

  it('rejects missing loại phiếu', () => {
    expect(() => phieuHanhChinhSchema.parse({ ...base, ma_phieu: '' })).toThrow();
  });

  it('rejects invalid loại phiếu code', () => {
    expect(() => phieuHanhChinhSchema.parse({ ...base, ma_phieu: 'XX' })).toThrow();
  });

  it('rejects invalid buổi', () => {
    expect(() =>
      phieuHanhChinhSchema.parse({ ...base, buoi_bat_dau: 'toi' }),
    ).toThrow();
  });

  it('rejects invalid time', () => {
    expect(() =>
      phieuHanhChinhSchema.parse({ ...base, gio_bat_dau: '25:99' }),
    ).toThrow();
  });
});
