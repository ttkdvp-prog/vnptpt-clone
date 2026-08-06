import { describe, expect, it } from 'vitest';
import { danhSachTaiLieuSchema } from '../schema';

describe('danhSachTaiLieuSchema', () => {
  it('accepts valid document', () => {
    const parsed = danhSachTaiLieuSchema.parse({
      id_loai_tai_lieu: '1',
      ten_tai_lieu: 'Mẫu hợp đồng',
      mo_ta: 'Mô tả',
      link_tai_lieu: 'https://example.com/a',
      ghi_chu: null,
      trang_thai: 'du_thao',
      id_chuc_vu: ['1'],
      id_nhan_vien: [],
    });
    expect(parsed.ten_tai_lieu).toBe('Mẫu hợp đồng');
    expect(parsed.id_chuc_vu).toEqual(['1']);
  });

  it('rejects short name', () => {
    expect(() =>
      danhSachTaiLieuSchema.parse({
        id_loai_tai_lieu: '1',
        ten_tai_lieu: 'A',
        trang_thai: 'du_thao',
      }),
    ).toThrow();
  });

  it('rejects invalid link', () => {
    expect(() =>
      danhSachTaiLieuSchema.parse({
        id_loai_tai_lieu: '1',
        ten_tai_lieu: 'Tài liệu A',
        link_tai_lieu: 'not-a-url',
        trang_thai: 'hieu_luc',
      }),
    ).toThrow();
  });
});
