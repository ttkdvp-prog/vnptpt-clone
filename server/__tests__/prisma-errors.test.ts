import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { isUniqueViolation, translateCreateError } from '../prisma-errors';

function makeKnownError(code: string, message = 'lỗi prisma'): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion: '0.0.0' });
}

describe('isUniqueViolation', () => {
  it('true khi PrismaClientKnownRequestError code P2002', () => {
    expect(isUniqueViolation(makeKnownError('P2002'))).toBe(true);
  });

  it('false khi PrismaClientKnownRequestError code khác (vd P2003)', () => {
    expect(isUniqueViolation(makeKnownError('P2003'))).toBe(false);
  });

  /**
   * Hành vi hiện tại đáng ngờ: fallback check chuỗi khớp BẤT KỲ message nào chứa
   * "unique" — kể cả khi lỗi không liên quan gì đến ràng buộc unique thật (false
   * positive). Pin lại để không ai vô tình "sửa" thành strict hơn mà không biết.
   */
  it('[hành vi hiện tại] Error thường có chữ "unique" trong message cũng bị coi là unique violation', () => {
    expect(isUniqueViolation(new Error('please make this field unique in the UI'))).toBe(true);
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
  it('P2002 → thông báo trùng dữ liệu, ưu tiên uniqueMessage tuỳ biến', () => {
    expect(translateCreateError(makeKnownError('P2002'), 'Mã nhân viên đã tồn tại')).toBe(
      'Mã nhân viên đã tồn tại',
    );
    expect(translateCreateError(makeKnownError('P2002'))).toBe('Dữ liệu bị trùng với bản ghi đã có');
  });

  it('P2003 (khoá ngoại) → thông báo tham chiếu không tồn tại', () => {
    expect(translateCreateError(makeKnownError('P2003'))).toBe('Dữ liệu tham chiếu không tồn tại');
  });

  it('PrismaClientKnownRequestError code khác → thông báo chung chung, không lộ lỗi thô', () => {
    const msg = translateCreateError(makeKnownError('P2025'));
    expect(msg).toBe('Không thể lưu dữ liệu. Vui lòng kiểm tra lại thông tin.');
    expect(msg).not.toContain('P2025');
  });

  it('PrismaClientValidationError → thông báo dữ liệu không hợp lệ, không lộ lỗi thô', () => {
    const err = new Prisma.PrismaClientValidationError('Argument `ten` is missing', {
      clientVersion: '0.0.0',
    });
    expect(translateCreateError(err)).toBe('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
  });

  /**
   * Hành vi hiện tại đáng ngờ (trái với doc comment "không bao giờ trả nguyên
   * văn lỗi Prisma thô về client"): một `Error` thường (không phải lỗi Prisma)
   * được trả THẲNG message của nó ra ngoài. Pin lại nguyên trạng.
   */
  it('[hành vi hiện tại] Error thường (không phải Prisma) trả nguyên văn message, không che', () => {
    expect(translateCreateError(new Error('boom nội bộ chi tiết'))).toBe('boom nội bộ chi tiết');
  });

  it('giá trị không phải Error nào cả → thông báo lỗi không xác định', () => {
    expect(translateCreateError('chuỗi bất kỳ')).toBe('Đã xảy ra lỗi không xác định');
    expect(translateCreateError(undefined)).toBe('Đã xảy ra lỗi không xác định');
  });
});
