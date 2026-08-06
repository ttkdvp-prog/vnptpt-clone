import { describe, expect, it } from 'vitest';
import { nguoiLienHeSchema } from '../schema';

const base = {
  id_khach_hang: '1',
  ho_ten: 'Nguyễn Văn An',
};

describe('nguoiLienHeSchema', () => {
  it('accepts full date birth', () => {
    const parsed = nguoiLienHeSchema.parse({
      ...base,
      ngay_sinh: '1985-03-12',
      so_dien_thoai: '0903111001',
      email: 'an@test.vn',
    });
    expect(parsed.ngay_sinh).toBe('1985-03-12');
    expect(parsed.email).toBe('an@test.vn');
  });

  it('accepts year-only birth', () => {
    const parsed = nguoiLienHeSchema.parse({
      ...base,
      ngay_sinh: '1990',
    });
    expect(parsed.ngay_sinh).toBe('1990');
  });

  it('nulls empty optional fields', () => {
    const parsed = nguoiLienHeSchema.parse({
      ...base,
      ngay_sinh: '  ',
      email: '',
      chuc_vu: null,
    });
    expect(parsed.ngay_sinh).toBeNull();
    expect(parsed.email).toBeNull();
  });

  it('rejects invalid birth', () => {
    expect(() =>
      nguoiLienHeSchema.parse({ ...base, ngay_sinh: '85-03-12' }),
    ).toThrow();
  });

  it('rejects missing customer', () => {
    expect(() => nguoiLienHeSchema.parse({ ...base, id_khach_hang: '' })).toThrow();
  });
});
