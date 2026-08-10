import { describe, it, expect } from 'vitest';
import { employeeSchema } from '../schema';

const validData = () => ({
  ho_ten: 'Nguyễn Văn A',
  trang_thai: 'Đang làm việc' as const,
});

const parse = (overrides: Record<string, unknown> = {}) =>
  employeeSchema.safeParse({ ...validData(), ...overrides });

describe('employeeSchema', () => {
  it('chấp nhận dữ liệu hợp lệ đầy đủ', () => {
    expect(parse().success).toBe(true);
  });

  describe('trường bắt buộc', () => {
    it('ho_ten ít nhất 2 ký tự', () => {
      expect(parse({ ho_ten: 'A' }).success).toBe(false);
      expect(parse({ ho_ten: 'AB' }).success).toBe(true);
    });
  });

  describe('trang_thai', () => {
    it('chỉ nhận các giá trị hợp lệ', () => {
      expect(parse({ trang_thai: 'Đang làm việc' }).success).toBe(true);
      expect(parse({ trang_thai: 'Không tồn tại' }).success).toBe(false);
    });
  });
});
