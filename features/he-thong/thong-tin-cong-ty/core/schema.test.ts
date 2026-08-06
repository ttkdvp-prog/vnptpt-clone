import { describe, expect, it } from 'vitest';
import { companySchema } from './schema';

const validData = {
  appName: 'ERP App',
  companyName: 'Công ty ABC',
  taxId: '0101234567',
};

describe('companySchema', () => {
  it('chấp nhận dữ liệu hợp lệ tối thiểu', () => {
    const result = companySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('báo lỗi khi appName quá ngắn', () => {
    const result = companySchema.safeParse({ ...validData, appName: 'A' });
    expect(result.success).toBe(false);
  });

  it('báo lỗi khi companyName quá ngắn', () => {
    const result = companySchema.safeParse({ ...validData, companyName: 'A' });
    expect(result.success).toBe(false);
  });

  it('báo lỗi khi taxId quá ngắn', () => {
    const result = companySchema.safeParse({ ...validData, taxId: '123' });
    expect(result.success).toBe(false);
  });

  it('báo lỗi khi email không hợp lệ', () => {
    const result = companySchema.safeParse({ ...validData, email: 'khong-phai-email' });
    expect(result.success).toBe(false);
  });

  it('chấp nhận email rỗng (optional)', () => {
    const result = companySchema.safeParse({ ...validData, email: '' });
    expect(result.success).toBe(true);
  });

  it('báo lỗi khi appLogo là chuỗi không hợp lệ', () => {
    const result = companySchema.safeParse({ ...validData, appLogo: 'khong-phai-url-hay-base64' });
    expect(result.success).toBe(false);
  });

  it('chấp nhận appLogo null', () => {
    const result = companySchema.safeParse({ ...validData, appLogo: null });
    expect(result.success).toBe(true);
  });
});
