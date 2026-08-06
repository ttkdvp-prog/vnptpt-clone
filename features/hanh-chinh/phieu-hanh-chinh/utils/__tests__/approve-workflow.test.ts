import { describe, expect, it } from 'vitest';
import { PHIEU_HANH_CHINH_STATUS } from '@/features/hanh-chinh/phieu-hanh-chinh/core/types';
import {
  canCancelPhieu,
  canDeletePhieu,
  canEditPhieu,
} from '../approve-workflow';

describe('phiếu hành chính locked-status permissions', () => {
  it('locks HCNS-pending and approved records for regular users', () => {
    expect(canEditPhieu(PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET)).toBe(false);
    expect(canDeletePhieu(PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET)).toBe(false);
    expect(canEditPhieu(PHIEU_HANH_CHINH_STATUS.DA_DUYET)).toBe(false);
    expect(canDeletePhieu(PHIEU_HANH_CHINH_STATUS.DA_DUYET)).toBe(false);
  });

  it('allows privileged users to manage HCNS-pending and approved records', () => {
    expect(canEditPhieu(PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET, true)).toBe(true);
    expect(canDeletePhieu(PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET, true)).toBe(true);
    expect(canEditPhieu(PHIEU_HANH_CHINH_STATUS.DA_DUYET, true)).toBe(true);
    expect(canDeletePhieu(PHIEU_HANH_CHINH_STATUS.DA_DUYET, true)).toBe(true);
  });

  it('keeps draft-stage behavior for regular users', () => {
    expect(canEditPhieu(PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET)).toBe(true);
    expect(canDeletePhieu(PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET)).toBe(true);
  });

  it('allows employee owner to cancel only while waiting for QL', () => {
    expect(
      canCancelPhieu(PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET, {
        currentEmployeeId: 'nv-1',
        id_nhan_vien: 'nv-1',
        nguoi_tao: 'nv-2',
      }),
    ).toBe(true);
    expect(
      canCancelPhieu(PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET, {
        currentEmployeeId: 'nv-1',
        id_nhan_vien: 'nv-2',
        nguoi_tao: 'nv-1',
      }),
    ).toBe(true);
  });

  it('blocks cancel after QL/HCNS approval or for non-owners', () => {
    expect(
      canCancelPhieu(PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET, {
        currentEmployeeId: 'nv-3',
        id_nhan_vien: 'nv-1',
        nguoi_tao: 'nv-2',
      }),
    ).toBe(false);
    expect(
      canCancelPhieu(PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET, {
        currentEmployeeId: 'nv-1',
        id_nhan_vien: 'nv-1',
        nguoi_tao: 'nv-1',
      }),
    ).toBe(false);
    expect(
      canCancelPhieu(PHIEU_HANH_CHINH_STATUS.DA_DUYET, {
        currentEmployeeId: 'nv-1',
        id_nhan_vien: 'nv-1',
        nguoi_tao: 'nv-1',
      }),
    ).toBe(false);
    expect(
      canCancelPhieu(PHIEU_HANH_CHINH_STATUS.DA_HUY, {
        currentEmployeeId: 'nv-1',
        id_nhan_vien: 'nv-1',
        nguoi_tao: 'nv-1',
      }),
    ).toBe(false);
  });
});
