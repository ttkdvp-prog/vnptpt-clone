import { describe, it, expect } from 'vitest';
import { congViecSchema } from '../schema';

const validData = () => ({
  cap: 'Tổ' as const,
  tieu_de: 'Chuẩn bị báo cáo tháng',
  to_ar: 'PB001',
  mnv_a: 'emp-000',
  uu_tien: 'Cao' as const,
  ngay_bd: '2026-01-01',
  ngay_kt: '2026-01-31',
});

const parse = (overrides: Record<string, unknown> = {}) =>
  congViecSchema.safeParse({ ...validData(), ...overrides });

describe('congViecSchema', () => {
  it('chấp nhận dữ liệu hợp lệ đầy đủ', () => {
    expect(parse().success).toBe(true);
  });

  it('chấp nhận khi thiếu các trường tùy chọn', () => {
    expect(parse({ mo_ta: undefined, to_r: undefined, mnv_r: undefined, mnv_c: undefined, ghi_chu: undefined, ngay_ht: undefined, tep_dinh_kem: undefined }).success).toBe(true);
  });

  describe('trường bắt buộc', () => {
    it('tieu_de bắt buộc', () => {
      expect(parse({ tieu_de: '' }).success).toBe(false);
    });
    it('to_ar bắt buộc', () => {
      expect(parse({ to_ar: '' }).success).toBe(false);
    });
    it('mnv_a bắt buộc', () => {
      expect(parse({ mnv_a: '' }).success).toBe(false);
    });
    it('ngay_bd bắt buộc', () => {
      expect(parse({ ngay_bd: '' }).success).toBe(false);
    });
    it('ngay_kt bắt buộc', () => {
      expect(parse({ ngay_kt: '' }).success).toBe(false);
    });
  });

  describe('cap', () => {
    it('chỉ nhận giá trị hợp lệ', () => {
      expect(parse({ cap: 'Trung tâm' }).success).toBe(true);
      expect(parse({ cap: 'Tổ' }).success).toBe(true);
      expect(parse({ cap: 'Không tồn tại' }).success).toBe(false);
    });
  });

  describe('uu_tien', () => {
    it('chỉ nhận 3 giá trị hợp lệ', () => {
      expect(parse({ uu_tien: 'Cao' }).success).toBe(true);
      expect(parse({ uu_tien: 'Trung bình' }).success).toBe(true);
      expect(parse({ uu_tien: 'Thấp' }).success).toBe(true);
      expect(parse({ uu_tien: 'Không tồn tại' }).success).toBe(false);
    });
  });

  describe('ngay_kt', () => {
    it('hợp lệ khi >= ngay_bd', () => {
      expect(parse({ ngay_bd: '2026-01-01', ngay_kt: '2026-06-01' }).success).toBe(true);
      expect(parse({ ngay_bd: '2026-01-01', ngay_kt: '2026-01-01' }).success).toBe(true);
    });
    it('không hợp lệ khi < ngay_bd', () => {
      expect(parse({ ngay_bd: '2026-06-01', ngay_kt: '2026-01-01' }).success).toBe(false);
    });
  });
});
