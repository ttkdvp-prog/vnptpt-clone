import { describe, expect, it } from 'vitest';
import { khachHangSchema } from '../schema';

const base = {
  ma_khach_hang: 'KH0001',
  ten_khach_hang: 'Công ty TNHH Minh Phát',
  id_nhom: '1',
  id_trang_thai: '2',
};

describe('khachHangSchema', () => {
  it('accepts valid customer', () => {
    const parsed = khachHangSchema.parse({
      ...base,
      so_dien_thoai: '0903111222',
      dia_chi: '12 Nguyễn Trãi, Q.1',
      ghi_chu: 'Khách VIP',
    });
    expect(parsed.ma_khach_hang).toBe('KH0001');
    expect(parsed.so_dien_thoai).toBe('0903111222');
  });

  it('nulls empty optional fields', () => {
    const parsed = khachHangSchema.parse({
      ...base,
      so_dien_thoai: '  ',
      dia_chi: '',
      ghi_chu: null,
    });
    expect(parsed.so_dien_thoai).toBeNull();
    expect(parsed.dia_chi).toBeNull();
    expect(parsed.ghi_chu).toBeNull();
  });

  it('rejects missing code', () => {
    expect(() => khachHangSchema.parse({ ...base, ma_khach_hang: '' })).toThrow();
  });

  it('rejects invalid phone', () => {
    expect(() =>
      khachHangSchema.parse({ ...base, so_dien_thoai: '12345' }),
    ).toThrow();
  });

  it('rejects missing group/status', () => {
    expect(() => khachHangSchema.parse({ ...base, id_nhom: '' })).toThrow();
    expect(() => khachHangSchema.parse({ ...base, id_trang_thai: '' })).toThrow();
  });
});
