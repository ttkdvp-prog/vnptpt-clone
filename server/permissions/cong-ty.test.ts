import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/server/repositories/nhan-vien', () => ({
  findEmployeeChucVuId: vi.fn(),
}));

vi.mock('@/server/repositories/phan-quyen', () => ({
  findQuyenCsvByChucVuAndModule: vi.fn(),
}));

import { findEmployeeChucVuId } from '@/server/repositories/nhan-vien';
import { findQuyenCsvByChucVuAndModule } from '@/server/repositories/phan-quyen';
import { assertCongTyPermission } from '@/server/permissions/cong-ty';

function mockContext(session: {
  employee_id: string;
  tai_khoan: string;
  cap_bac: number | null;
}) {
  return {
    get: (key: string) => (key === 'session' ? session : undefined),
    json: (body: unknown, status?: number) => ({ body, status: status ?? 200 }),
  } as never;
}

describe('assertCongTyPermission', () => {
  beforeEach(() => {
    vi.mocked(findEmployeeChucVuId).mockReset();
    vi.mocked(findQuyenCsvByChucVuAndModule).mockReset();
  });

  it('allows super on PATCH', async () => {
    const c = mockContext({ employee_id: '1', tai_khoan: 'admin', cap_bac: 1 });
    expect(await assertCongTyPermission(c, 'sua')).toBeNull();
  });

  it('allows GET with only xem', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('xem');

    const c = mockContext({ employee_id: '2', tai_khoan: 'nv', cap_bac: 4 });
    expect(await assertCongTyPermission(c, 'xem')).toBeNull();
  });

  it('allows GET with only sua', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('sua');

    const c = mockContext({ employee_id: '2', tai_khoan: 'nv', cap_bac: 4 });
    expect(await assertCongTyPermission(c, 'xem')).toBeNull();
  });

  it('denies PATCH without sua', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('xem');

    const c = mockContext({ employee_id: '2', tai_khoan: 'nv', cap_bac: 4 });
    const denied = await assertCongTyPermission(c, 'sua');
    expect(denied).toBeTruthy();
    expect((denied as { status: number }).status).toBe(403);
  });
});
