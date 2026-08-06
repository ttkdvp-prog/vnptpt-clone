import { describe, expect, it } from 'vitest';
import { thongBaoSchema } from '../schema';

describe('thongBaoSchema', () => {
  it('accepts valid payload with empty id_chuc_vu (all positions)', () => {
    const result = thongBaoSchema.safeParse({
      tg_dang: '2026-07-18T08:00:00.000Z',
      tieu_de: 'Thông báo họp',
      noi_dung: 'Nội dung họp định kỳ',
      id_chuc_vu: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts selected position ids', () => {
    const result = thongBaoSchema.safeParse({
      tg_dang: '2026-07-18T08:00:00.000Z',
      tieu_de: 'Thông báo riêng',
      noi_dung: 'Chỉ một số chức vụ',
      id_chuc_vu: ['1', '2'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id_chuc_vu).toEqual(['1', '2']);
    }
  });

  it('rejects empty title', () => {
    const result = thongBaoSchema.safeParse({
      tg_dang: '2026-07-18T08:00:00.000Z',
      tieu_de: '   ',
      noi_dung: 'Nội dung',
      id_chuc_vu: [],
    });
    expect(result.success).toBe(false);
  });
});
