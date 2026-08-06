import { describe, expect, it } from 'vitest';
import { hopDongSchema } from '../schema';

const base = {
  loai_hop_dong: 'chinh_thuc',
  ma_hop_dong: 'HD-CT-0001',
  ngay_ky: '2026-01-01',
  ngay_hieu_luc: '2026-01-05',
  ngay_ket_thuc: null,
  id_nhan_vien: '1',
  id_chuc_vu: '1',
  id_phong_ban: '1',
  muc_luong: '10.000.000 đ/tháng',
  hinh_thuc_tra_luong: 'theo_thang',
  trang_thai: 'da_xong',
};

describe('hopDongSchema', () => {
  it('accepts a valid contract', () => {
    const parsed = hopDongSchema.parse(base);
    expect(parsed.ma_hop_dong).toBe('HD-CT-0001');
    expect(parsed.ngay_ket_thuc).toBeNull();
  });

  it('rejects short code', () => {
    expect(() => hopDongSchema.parse({ ...base, ma_hop_dong: 'H' })).toThrow();
  });

  it('rejects missing employee', () => {
    expect(() => hopDongSchema.parse({ ...base, id_nhan_vien: '' })).toThrow();
  });

  it('rejects end date before effective date', () => {
    expect(() =>
      hopDongSchema.parse({ ...base, ngay_ket_thuc: '2026-01-04' }),
    ).toThrow();
  });

  it('accepts end date after effective date', () => {
    const parsed = hopDongSchema.parse({ ...base, ngay_ket_thuc: '2026-06-01' });
    expect(parsed.ngay_ket_thuc).toBe('2026-06-01');
  });
});
