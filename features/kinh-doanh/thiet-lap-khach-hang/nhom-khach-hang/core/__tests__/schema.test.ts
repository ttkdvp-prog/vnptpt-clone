import { describe, expect, it } from 'vitest';
import { nhomKhachHangSchema } from '../schema';

describe('nhomKhachHangSchema', () => {
  it('accepts valid name and description', () => {
    const parsed = nhomKhachHangSchema.parse({
      ten_nhom: 'VIP',
      mo_ta: 'Khách chiến lược',
    });
    expect(parsed.ten_nhom).toBe('VIP');
    expect(parsed.mo_ta).toBe('Khách chiến lược');
  });

  it('trims and nulls empty description', () => {
    const parsed = nhomKhachHangSchema.parse({
      ten_nhom: '  Tiềm năng  ',
      mo_ta: '   ',
    });
    expect(parsed.ten_nhom).toBe('Tiềm năng');
    expect(parsed.mo_ta).toBeNull();
  });

  it('rejects short name', () => {
    expect(() => nhomKhachHangSchema.parse({ ten_nhom: 'A' })).toThrow();
  });
});
