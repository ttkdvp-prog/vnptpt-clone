// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/repositories/nhan-vien', () => ({
  findEmployeeChucVuId: vi.fn(),
}));
vi.mock('@/server/repositories/phan-quyen', () => ({
  findQuyenCsvByChucVuAndModule: vi.fn(),
}));

import { findEmployeeChucVuId } from '@/server/repositories/nhan-vien';
import { findQuyenCsvByChucVuAndModule } from '@/server/repositories/phan-quyen';
import { resolveModuleGrant, grantAllowsRow } from '../bulk-grant';

function mockContext(session: unknown) {
  return {
    get: (key: string) => (key === 'session' ? session : undefined),
    json: (body: unknown, status?: number) => ({ body, status: status ?? 200 }),
  } as never;
}

beforeEach(() => vi.clearAllMocks());

describe('resolveModuleGrant', () => {
  it('không có session ⇒ Response 401', async () => {
    const result = await resolveModuleGrant(mockContext(undefined), 'khach_hang');
    expect((result as { status: number }).status).toBe(401);
  });

  it('cap_bac === 1 ⇒ super, không cần tra chức vụ', async () => {
    const result = await resolveModuleGrant(
      mockContext({ employee_id: '1', cap_bac: 1 }),
      'khach_hang',
    );
    expect(result).toMatchObject({ isSuper: true, isModuleAdmin: true });
    expect(findEmployeeChucVuId).not.toHaveBeenCalled();
  });

  it('không tra được chức vụ ⇒ Response 403', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(null);
    const result = await resolveModuleGrant(
      mockContext({ employee_id: '2', cap_bac: 4 }),
      'khach_hang',
    );
    expect((result as { status: number }).status).toBe(403);
  });

  it('token admin/tat_ca trên module ⇒ isModuleAdmin', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('admin,xem');
    const result = await resolveModuleGrant(
      mockContext({ employee_id: '2', cap_bac: 4 }),
      'khach_hang',
    );
    expect(result).toMatchObject({ isSuper: false, isModuleAdmin: true });
  });

  it('token thường ⇒ isModuleAdmin false', async () => {
    vi.mocked(findEmployeeChucVuId).mockResolvedValue(10);
    vi.mocked(findQuyenCsvByChucVuAndModule).mockResolvedValue('xem,sua');
    const result = await resolveModuleGrant(
      mockContext({ employee_id: '2', cap_bac: 4 }),
      'khach_hang',
    );
    expect(result).toMatchObject({
      isSuper: false,
      isModuleAdmin: false,
      tokens: ['xem', 'sua'],
    });
  });
});

describe('grantAllowsRow', () => {
  const superGrant = { session: { employee_id: '1', tai_khoan: 'a', cap_bac: 1 }, tokens: [], isSuper: true, isModuleAdmin: true };
  const adminGrant = { session: { employee_id: '1', tai_khoan: 'a', cap_bac: 4 }, tokens: ['admin'], isSuper: false, isModuleAdmin: true };
  const xemOnlyGrant = { session: { employee_id: '2', tai_khoan: 'b', cap_bac: 4 }, tokens: ['xem'], isSuper: false, isModuleAdmin: false };

  it('super hoặc module admin ⇒ mọi dòng, kể cả xoa', () => {
    expect(grantAllowsRow(superGrant, 'xoa')).toBe(true);
    expect(grantAllowsRow(adminGrant, 'xoa')).toBe(true);
  });

  it('token khớp action ⇒ qua, không cần own-row', () => {
    expect(grantAllowsRow(xemOnlyGrant, 'xem')).toBe(true);
  });

  it('own-row (nguoi_tao khớp) chỉ áp cho xem/sua, KHÔNG áp cho xoa', () => {
    expect(grantAllowsRow(xemOnlyGrant, 'sua', { recordNguoiTao: '2' })).toBe(true);
    expect(grantAllowsRow(xemOnlyGrant, 'xoa', { recordNguoiTao: '2' })).toBe(false);
  });

  it('isSelf (recordId khớp chính mình) chỉ áp cho xem/sua', () => {
    expect(grantAllowsRow(xemOnlyGrant, 'sua', { recordId: '2' })).toBe(true);
    expect(grantAllowsRow(xemOnlyGrant, 'xoa', { recordId: '2' })).toBe(false);
  });

  it('xem-only sở hữu 2/5 dòng ⇒ đúng 2 dòng qua, 3 dòng còn lại từ chối', () => {
    const rows = [
      { id: '10', nguoi_tao: '2' },
      { id: '11', nguoi_tao: '99' },
      { id: '12', nguoi_tao: '2' },
      { id: '13', nguoi_tao: '99' },
      { id: '14', nguoi_tao: '99' },
    ];
    const allowed = rows.filter((r) =>
      grantAllowsRow(xemOnlyGrant, 'sua', { recordNguoiTao: r.nguoi_tao }),
    );
    expect(allowed.map((r) => r.id)).toEqual(['10', '12']);
  });

  it('không có own-row lẫn self ⇒ từ chối', () => {
    expect(grantAllowsRow(xemOnlyGrant, 'sua', { recordNguoiTao: '99' })).toBe(false);
  });
});
