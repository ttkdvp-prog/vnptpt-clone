import { describe, expect, it } from 'vitest';
import { getCompany, getCompanyBranding, upsertCompany } from './cong-ty-service';
import type { CompanyFormValues } from '../core/types';

describe('cong-ty-service (mock mode)', () => {
  it('getCompany trả về thông tin công ty mặc định', async () => {
    const info = await getCompany();
    expect(info.appName).toBeTruthy();
    expect(info.companyName).toBeTruthy();
  });

  it('getCompanyBranding trả về đúng 3 field branding', async () => {
    const branding = await getCompanyBranding();
    expect(branding).toHaveProperty('appName');
    expect(branding).toHaveProperty('appDescription');
    expect(branding).toHaveProperty('appLogo');
  });

  it('upsertCompany cập nhật và getCompany đọc lại đúng giá trị mới', async () => {
    const values: CompanyFormValues = {
      appName: 'Test App Name',
      companyName: 'Công ty Test',
      taxId: '9999999999',
      address: 'Địa chỉ test',
      phone: '0900000000',
      email: 'test@example.com',
      website: 'https://example.com',
      representative: 'Nguyễn Văn Test',
      representativeTitle: 'Giám đốc',
      signingPlace: 'TP. Test',
    };

    const saved = await upsertCompany(values);
    expect(saved.appName).toBe('Test App Name');
    expect(saved.companyName).toBe('Công ty Test');

    const reloaded = await getCompany();
    expect(reloaded.appName).toBe('Test App Name');
    expect(reloaded.companyName).toBe('Công ty Test');
  });
});
