import {
  PHIEU_HANH_CHINH_STATUS,
  PHIEU_HANH_CHINH_STATUS_LABELS,
} from '../core/types';
import { txt } from '@/lib/text';

export function canApproveQl(status: string): boolean {
  return status === PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET;
}

export function canApproveHcns(status: string): boolean {
  return status === PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET;
}

export function canRejectPhieu(status: string): boolean {
  return (
    status === PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET ||
    status === PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET
  );
}

/**
 * Nhân sự tự hủy phiếu — chỉ khi còn Chờ QL duyệt.
 * Sau khi QL/HCNS đã duyệt (hoặc từ chối/đã hủy) không được hủy.
 */
export function canCancelPhieu(
  status: string,
  opts: { currentEmployeeId?: string | null; id_nhan_vien?: string | null; nguoi_tao?: string | null },
): boolean {
  if (status !== PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET) {
    return false;
  }
  const me = opts.currentEmployeeId != null ? String(opts.currentEmployeeId) : '';
  if (!me) return false;
  return (
    me === String(opts.id_nhan_vien ?? '') ||
    me === String(opts.nguoi_tao ?? '')
  );
}

export function canEditPhieu(
  status: string,
  canManageLocked = false,
): boolean {
  return (
    status === PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET ||
    ((status === PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET ||
      status === PHIEU_HANH_CHINH_STATUS.DA_DUYET) &&
      canManageLocked)
  );
}

export function canDeletePhieu(
  status: string,
  canManageLocked = false,
): boolean {
  return (
    (status !== PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET &&
      status !== PHIEU_HANH_CHINH_STATUS.DA_DUYET) ||
    canManageLocked
  );
}

export function getStatusLabel(status: string): string {
  return (
    PHIEU_HANH_CHINH_STATUS_LABELS[
      status as keyof typeof PHIEU_HANH_CHINH_STATUS_LABELS
    ] ?? status
  );
}

export function getApproveQlConfirm(): { title: string; message: string } {
  return {
    title: txt('adminForm.approveQlTitle'),
    message: txt('adminForm.approveQlMessage'),
  };
}

export function getApproveHcnsConfirm(): { title: string; message: string } {
  return {
    title: txt('adminForm.approveHcnsTitle'),
    message: txt('adminForm.approveHcnsMessage'),
  };
}

export function getRejectConfirm(): { title: string; message: string } {
  return {
    title: txt('adminForm.rejectTitle'),
    message: txt('adminForm.rejectMessage'),
  };
}

export function getCancelConfirm(): { title: string; message: string } {
  return {
    title: txt('adminForm.cancelTitle'),
    message: txt('adminForm.cancelMessage'),
  };
}
