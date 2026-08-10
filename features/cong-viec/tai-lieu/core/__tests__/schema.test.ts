import { describe, it, expect } from 'vitest';
import { taiLieuSchema } from '../schema';

const validData = () => ({
  ten_ho_so: 'Hồ sơ hợp đồng thuê văn phòng',
  danh_muc: 'Hợp đồng',
  to: 'PB001',
  ngay_ban_hanh: '2026-01-01',
  tinh_trang: 'Đang hiệu lực' as const,
});

const parse = (overrides: Record<string, unknown> = {}) =>
  taiLieuSchema.safeParse({ ...validData(), ...overrides });

describe('taiLieuSchema', () => {
  it('chấp nhận dữ liệu hợp lệ đầy đủ', () => {
    expect(parse().success).toBe(true);
  });

  it('chấp nhận khi thiếu các trường tùy chọn', () => {
    expect(parse({ ngay_ket_thuc: undefined, url: undefined, mo_ta: undefined }).success).toBe(true);
  });

  describe('trường bắt buộc', () => {
    it('ten_ho_so bắt buộc', () => {
      expect(parse({ ten_ho_so: '' }).success).toBe(false);
    });
    it('danh_muc bắt buộc', () => {
      expect(parse({ danh_muc: '' }).success).toBe(false);
    });
    it('to bắt buộc', () => {
      expect(parse({ to: '' }).success).toBe(false);
    });
    it('ngay_ban_hanh bắt buộc', () => {
      expect(parse({ ngay_ban_hanh: '' }).success).toBe(false);
    });
  });

  describe('tinh_trang', () => {
    it('chỉ nhận 3 giá trị hợp lệ', () => {
      expect(parse({ tinh_trang: 'Đang hiệu lực' }).success).toBe(true);
      expect(parse({ tinh_trang: 'Hết hiệu lực' }).success).toBe(true);
      expect(parse({ tinh_trang: 'Dự thảo' }).success).toBe(true);
      expect(parse({ tinh_trang: 'Không tồn tại' }).success).toBe(false);
    });
  });

  describe('ngay_ket_thuc', () => {
    it('hợp lệ khi >= ngay_ban_hanh', () => {
      expect(parse({ ngay_ban_hanh: '2026-01-01', ngay_ket_thuc: '2026-06-01' }).success).toBe(true);
      expect(parse({ ngay_ban_hanh: '2026-01-01', ngay_ket_thuc: '2026-01-01' }).success).toBe(true);
    });
    it('không hợp lệ khi < ngay_ban_hanh', () => {
      expect(parse({ ngay_ban_hanh: '2026-06-01', ngay_ket_thuc: '2026-01-01' }).success).toBe(false);
    });
  });
});
