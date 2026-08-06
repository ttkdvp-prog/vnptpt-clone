import { describe, expect, it } from 'vitest';
import { loaiTaiLieuSchema } from '../schema';

describe('loaiTaiLieuSchema', () => {
  it('accepts valid order, name and description', () => {
    const parsed = loaiTaiLieuSchema.parse({
      thu_tu: 1,
      ten_loai_tai_lieu: 'Hợp đồng',
      mo_ta: 'Tài liệu hợp đồng',
    });
    expect(parsed.thu_tu).toBe(1);
    expect(parsed.ten_loai_tai_lieu).toBe('Hợp đồng');
    expect(parsed.mo_ta).toBe('Tài liệu hợp đồng');
  });

  it('trims and nulls empty description', () => {
    const parsed = loaiTaiLieuSchema.parse({
      thu_tu: 0,
      ten_loai_tai_lieu: '  Biên bản  ',
      mo_ta: '   ',
    });
    expect(parsed.ten_loai_tai_lieu).toBe('Biên bản');
    expect(parsed.mo_ta).toBeNull();
  });

  it('rejects short name', () => {
    expect(() =>
      loaiTaiLieuSchema.parse({ thu_tu: 0, ten_loai_tai_lieu: 'A' }),
    ).toThrow();
  });

  it('rejects negative order', () => {
    expect(() =>
      loaiTaiLieuSchema.parse({ thu_tu: -1, ten_loai_tai_lieu: 'Hợp đồng' }),
    ).toThrow();
  });
});
