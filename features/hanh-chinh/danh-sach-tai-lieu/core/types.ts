/** Trạng thái tài liệu (cố định). */
export const DOCUMENT_STATUS = {
  DU_THAO: 'du_thao',
  HIEU_LUC: 'hieu_luc',
  LOI_THOI: 'loi_thoi',
  CHO_SUA: 'cho_sua',
} as const;

export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  du_thao: 'Dự thảo',
  hieu_luc: 'Hiệu lực',
  loi_thoi: 'Lỗi thời',
  cho_sua: 'Chờ sửa',
};

export const DOCUMENT_STATUS_OPTIONS = (
  Object.keys(DOCUMENT_STATUS_LABELS) as DocumentStatus[]
).map((value) => ({ value, label: DOCUMENT_STATUS_LABELS[value] }));

export interface DanhSachTaiLieu {
  id: string;
  id_loai_tai_lieu: string;
  ten_tai_lieu: string;
  mo_ta: string | null;
  link_tai_lieu: string | null;
  ghi_chu: string | null;
  trang_thai: DocumentStatus | string;
  id_chuc_vu: string[];
  id_nhan_vien: string[];
  ten_chuc_vu?: string[];
  ten_nhan_vien?: string[];
  ten_loai_tai_lieu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface DanhSachTaiLieuFilters {
  columnSearch: Record<string, string>;
  id_loai_tai_lieu: string[];
  trang_thai: string[];
  nguoi_tao: string[];
}
