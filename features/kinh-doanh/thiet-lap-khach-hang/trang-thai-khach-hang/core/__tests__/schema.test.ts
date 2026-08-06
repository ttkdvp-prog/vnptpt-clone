import { describe, expect, it } from 'vitest';
import { trangThaiKhachHangSchema } from '../schema';

describe('trangThaiKhachHangSchema', () => {
  it('accepts valid name and description', () => {
    const parsed = trangThaiKhachHangSchema.parse({
      ten_trang_thai: 'Mới',
      mo_ta: 'Vừa tạo hồ sơ',
    });
    expect(parsed.ten_trang_thai).toBe('Mới');
    expect(parsed.mo_ta).toBe('Vừa tạo hồ sơ');
  });

  it('trims and nulls empty description', () => {
    const parsed = trangThaiKhachHangSchema.parse({
      ten_trang_thai: '  Chốt deal  ',
      mo_ta: '   ',
    });
    expect(parsed.ten_trang_thai).toBe('Chốt deal');
    expect(parsed.mo_ta).toBeNull();
  });

  it('rejects short name', () => {
    expect(() => trangThaiKhachHangSchema.parse({ ten_trang_thai: 'A' })).toThrow();
  });
});
