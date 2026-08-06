/** Trạng thái workflow phiếu hành chính (cố định). */
export const PHIEU_HANH_CHINH_STATUS = {
  CHO_QL_DUYET: 'cho_ql_duyet',
  CHO_HCNS_DUYET: 'cho_hcns_duyet',
  DA_DUYET: 'da_duyet',
  TU_CHOI: 'tu_choi',
  DA_HUY: 'da_huy',
} as const;

export type PhieuHanhChinhStatus =
  (typeof PHIEU_HANH_CHINH_STATUS)[keyof typeof PHIEU_HANH_CHINH_STATUS];

export const PHIEU_HANH_CHINH_STATUS_LABELS: Record<PhieuHanhChinhStatus, string> = {
  cho_ql_duyet: 'Chờ QL duyệt',
  cho_hcns_duyet: 'Chờ HCNS duyệt',
  da_duyet: 'Đã duyệt',
  tu_choi: 'Từ chối',
  da_huy: 'Đã hủy',
};

export const PHIEU_HANH_CHINH_STATUS_OPTIONS = (
  Object.keys(PHIEU_HANH_CHINH_STATUS_LABELS) as PhieuHanhChinhStatus[]
).map((value) => ({ value, label: PHIEU_HANH_CHINH_STATUS_LABELS[value] }));

/** Buổi làm việc / nghỉ. */
export const PHIEU_BUOI = {
  SANG: 'sang',
  CHIEU: 'chieu',
  DEM: 'dem',
} as const;

export type PhieuBuoi = (typeof PHIEU_BUOI)[keyof typeof PHIEU_BUOI];

export const PHIEU_BUOI_LABELS: Record<PhieuBuoi, string> = {
  sang: 'Sáng',
  chieu: 'Chiều',
  dem: 'Đêm',
};

export const PHIEU_BUOI_OPTIONS = (Object.keys(PHIEU_BUOI_LABELS) as PhieuBuoi[]).map(
  (value) => ({ value, label: PHIEU_BUOI_LABELS[value] }),
);

export interface PhieuHanhChinh {
  id: string;
  ma_phieu: string;
  id_nhan_vien: string;
  tu_ngay: string;
  buoi_bat_dau: string;
  den_ngay: string;
  buoi_ket_thuc: string;
  gio_bat_dau: string | null;
  gio_ket_thuc: string | null;
  ly_do: string | null;
  hinh_anh: string[];
  trang_thai: PhieuHanhChinhStatus | string;
  id_ql_duyet: string | null;
  tg_ql_duyet: string | null;
  ghi_chu_ql: string | null;
  id_hcns_duyet: string | null;
  tg_hcns_duyet: string | null;
  ghi_chu_hcns: string | null;
  ly_do_tu_choi: string | null;
  ten_loai_phieu?: string | null;
  ten_nhan_vien?: string | null;
  id_phong_ban?: string | null;
  ten_phong_ban?: string | null;
  ten_ql_duyet?: string | null;
  ten_hcns_duyet?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface PhieuHanhChinhFilters {
  columnSearch: Record<string, string>;
  ma_phieu: string[];
  trang_thai: string[];
  id_nhan_vien: string[];
  id_phong_ban: string[];
  nguoi_tao: string[];
  /** DateRangePicker preset — `all` = no date filter */
  date_preset: string;
  date_custom_start: string;
  date_custom_end: string;
}
