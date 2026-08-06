import type { DanhSachTaiLieuFormValues } from '../core/schema';
import {
  DOCUMENT_STATUS,
  type DanhSachTaiLieu,
  type DocumentStatus,
} from '../core/types';

export function toDocumentFormValues(
  item: DanhSachTaiLieu,
  patch: Partial<DanhSachTaiLieuFormValues> = {},
): DanhSachTaiLieuFormValues {
  const statusValues = Object.values(DOCUMENT_STATUS) as string[];
  const trangThai = statusValues.includes(item.trang_thai)
    ? (item.trang_thai as DocumentStatus)
    : DOCUMENT_STATUS.DU_THAO;
  return {
    id_loai_tai_lieu: item.id_loai_tai_lieu,
    ten_tai_lieu: item.ten_tai_lieu,
    mo_ta: item.mo_ta,
    link_tai_lieu: item.link_tai_lieu,
    ghi_chu: item.ghi_chu,
    trang_thai: trangThai,
    id_chuc_vu: item.id_chuc_vu ?? [],
    id_nhan_vien: item.id_nhan_vien ?? [],
    ...patch,
  };
}
