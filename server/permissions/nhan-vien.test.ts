import { describe, expect, it, vi, beforeEach } from 'vitest';
import { parseQuyenCsv } from '@/lib/permission-db-keys';

vi.mock('@/server/repositories/nhan-vien', () => ({
  findEmployeeChucVuId: vi.fn(),
}));

vi.mock('@/server/repositories/phan-quyen', () => ({
  findQuyenCsvByChucVuAndModule: vi.fn(),
}));

import { findEmployeeChucVuId } from '@/server/repositories/nhan-vien';
import { findQuyenCsvByChucVuAndModule } from '@/server/repositories/phan-quyen';
import { assertNhanVienPermission } from '@/server/permissions/nhan-vien';

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

describe('assertNhanVienPermission', () => {
  beforeEach(() => {
    vi.mocked(findEmployeeChucVuId).mockReset();
    vi.mocked(findQuyenCsvByChucVuAndModule).mockReset();
  });

  it('allows super user (cap_bac === 1)', async () => {
    const c = mockContext({ employee_id: '1', tai_khoan: 'admin', cap_bac: 1 });
    const result = await assertNhanVienPermission(c, 'xoa');
    expect(result).toBeNull();
  });

  it('allows when matrix has them', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('xem,them,sua');

    const c = mockContext({ employee_id: '2', tai_khoan: 'nv', cap_bac: 4 });
    expect(await assertNhanVienPermission(c, 'them')).toBeNull();
    expect(parseQuyenCsv('xem,them,sua')).toContain('them');
  });

  it('denies delete without xoa even for creator', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('xem,sua');

    const c = mockContext({ employee_id: '2', tai_khoan: 'nv', cap_bac: 4 });
    const denied = await assertNhanVienPermission(c, 'xoa', {
      recordNguoiTao: '2',
    });
    expect(denied).toBeTruthy();
    expect((denied as { status: number }).status).toBe(403);
  });

  it('allows sua for creator without sua token', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('xem');

    const c = mockContext({ employee_id: '2', tai_khoan: 'nv', cap_bac: 4 });
    expect(
      await assertNhanVienPermission(c, 'sua', { recordNguoiTao: '2' }),
    ).toBeNull();
  });
});
