import { describe, expect, it, vi, beforeEach } from 'vitest';
import { sanitizeQuyenCsv } from '@/server/repositories/phan-quyen';

vi.mock('@/server/repositories/nhan-vien', () => ({
  findEmployeeChucVuId: vi.fn(),
}));

vi.mock('@/server/repositories/phan-quyen', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/repositories/phan-quyen')>();
  return {
    ...actual,
    findQuyenCsvByChucVuAndModule: vi.fn(),
  };
});

import { findEmployeeChucVuId } from '@/server/repositories/nhan-vien';
import { findQuyenCsvByChucVuAndModule } from '@/server/repositories/phan-quyen';
import { assertPhanQuyenPermission } from '@/server/permissions/phan-quyen';

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

describe('assertPhanQuyenPermission', () => {
  beforeEach(() => {
    vi.mocked(findEmployeeChucVuId).mockReset();
    vi.mocked(findQuyenCsvByChucVuAndModule).mockReset();
  });

  it('allows PUT with sua', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('sua');

    const c = mockContext({ employee_id: '2', tai_khoan: 'nv', cap_bac: 4 });
    expect(await assertPhanQuyenPermission(c, 'sua')).toBeNull();
  });

  it('denies PUT with only them', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('them,xoa');

    const c = mockContext({ employee_id: '2', tai_khoan: 'nv', cap_bac: 4 });
    const denied = await assertPhanQuyenPermission(c, 'sua');
    expect(denied).toBeTruthy();
    expect((denied as { status: number }).status).toBe(403);
  });

  it('allows GET with xem', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('xem');

    const c = mockContext({ employee_id: '2', tai_khoan: 'nv', cap_bac: 4 });
    expect(await assertPhanQuyenPermission(c, 'xem')).toBeNull();
  });
});

describe('sanitizeQuyenCsv', () => {
  it('strips admin tokens when stripAdmin', () => {
    expect(sanitizeQuyenCsv('xem,admin,tat_ca', { stripAdmin: true })).toBe('xem');
  });

  it('keeps admin when not stripping', () => {
    expect(sanitizeQuyenCsv('xem,admin')).toBe('xem,admin');
  });
});
