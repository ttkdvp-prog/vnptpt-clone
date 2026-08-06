import { describe, expect, it } from 'vitest';
import { canViewerAccessThongBao } from '@/server/repositories/thong-bao';
import type { ThongBaoViewer } from '@/server/permissions/thong-bao';

const baseViewer = (partial: Partial<ThongBaoViewer>): ThongBaoViewer => ({
  bypassAcl: false,
  employeeId: 10,
  chucVuId: 2,
  ...partial,
});

describe('canViewerAccessThongBao', () => {
  it('allows when id_chuc_vu is empty (all positions)', () => {
    expect(
      canViewerAccessThongBao(
        { nguoi_tao: '99', id_chuc_vu: [] },
        baseViewer({}),
      ),
    ).toBe(true);
  });

  it('allows when viewer position is in id_chuc_vu', () => {
    expect(
      canViewerAccessThongBao(
        { nguoi_tao: '99', id_chuc_vu: ['1', '2'] },
        baseViewer({ chucVuId: 2 }),
      ),
    ).toBe(true);
  });

  it('denies when viewer position is not in id_chuc_vu', () => {
    expect(
      canViewerAccessThongBao(
        { nguoi_tao: '99', id_chuc_vu: ['1', '3'] },
        baseViewer({ chucVuId: 2 }),
      ),
    ).toBe(false);
  });

  it('allows creator even if position not listed', () => {
    expect(
      canViewerAccessThongBao(
        { nguoi_tao: '10', id_chuc_vu: ['1'] },
        baseViewer({ employeeId: 10, chucVuId: 2 }),
      ),
    ).toBe(true);
  });

  it('allows bypassAcl for admin', () => {
    expect(
      canViewerAccessThongBao(
        { nguoi_tao: '99', id_chuc_vu: ['1'] },
        baseViewer({ bypassAcl: true, chucVuId: 2 }),
      ),
    ).toBe(true);
  });
});
