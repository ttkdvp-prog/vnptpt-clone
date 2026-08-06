import { describe, it, expect } from 'vitest';
import { isUniqueViolation, translateCreateError } from '../prisma-errors';

describe('isUniqueViolation', () => {
  it('true khi message chứa "Unique constraint" hoặc "unique"', () => {
    expect(isUniqueViolation(new Error('Unique constraint failed on ma_khach_hang'))).toBe(true);
    expect(isUniqueViolation(new Error('please make this field unique in the UI'))).toBe(true);
  });

  it('true khi message chứa "trùng"', () => {
    expect(isUniqueViolation(new Error('Mã khách hàng bị trùng'))).toBe(true);
  });

  it('false khi Error thường không có từ khoá liên quan', () => {
    expect(isUniqueViolation(new Error('connection timeout'))).toBe(false);
  });

  it('false khi không phải Error (string, undefined, object thô)', () => {
    expect(isUniqueViolation('string lỗi bất kỳ')).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation({ code: 'P2002' })).toBe(false);
  });
});

describe('translateCreateError', () => {
  it('unique violation → thông báo trùng dữ liệu, ưu tiên uniqueMessage tuỳ biến', () => {
    expect(translateCreateError(new Error('Unique constraint'), 'Mã nhân viên đã tồn tại')).toBe(
      'Mã nhân viên đã tồn tại',
    );
    expect(translateCreateError(new Error('Unique constraint'))).toBe('Dữ liệu bị trùng với bản ghi đã có');
  });

  it('Error thường (không unique) → trả nguyên văn message', () => {
    expect(translateCreateError(new Error('boom nội bộ chi tiết'))).toBe('boom nội bộ chi tiết');
  });

  it('giá trị không phải Error nào cả → thông báo lỗi không xác định', () => {
    expect(translateCreateError('chuỗi bất kỳ')).toBe('Đã xảy ra lỗi không xác định');
    expect(translateCreateError(undefined)).toBe('Đã xảy ra lỗi không xác định');
  });
});
