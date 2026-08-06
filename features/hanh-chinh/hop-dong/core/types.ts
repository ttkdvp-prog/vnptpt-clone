/** Loại hợp đồng (cố định). */
export const CONTRACT_TYPE = {
  THU_VIEC: 'thu_viec',
  CHINH_THUC: 'chinh_thuc',
} as const;

export type ContractType = (typeof CONTRACT_TYPE)[keyof typeof CONTRACT_TYPE];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  thu_viec: 'Thử việc',
  chinh_thuc: 'Chính thức',
};

export const CONTRACT_TYPE_OPTIONS = (
  Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]
).map((value) => ({ value, label: CONTRACT_TYPE_LABELS[value] }));

/** Trạng thái hoàn thành hồ sơ hợp đồng. */
export const CONTRACT_STATUS = {
  CHUA_XONG: 'chua_xong',
  DA_XONG: 'da_xong',
} as const;

export type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  chua_xong: 'Chưa xong',
  da_xong: 'Đã xong',
};

export const CONTRACT_STATUS_OPTIONS = (
  Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]
).map((value) => ({ value, label: CONTRACT_STATUS_LABELS[value] }));

/** Hình thức trả lương (cố định). */
export const SALARY_MODE = {
  THEO_THANG: 'theo_thang',
  THEO_NGAY: 'theo_ngay',
  THEO_GIO: 'theo_gio',
} as const;

export type SalaryMode = (typeof SALARY_MODE)[keyof typeof SALARY_MODE];

export const SALARY_MODE_LABELS: Record<SalaryMode, string> = {
  theo_thang: 'Theo tháng',
  theo_ngay: 'Theo ngày',
  theo_gio: 'Theo giờ',
};

export const SALARY_MODE_OPTIONS = (
  Object.keys(SALARY_MODE_LABELS) as SalaryMode[]
).map((value) => ({ value, label: SALARY_MODE_LABELS[value] }));

export interface HopDong {
  id: string;
  loai_hop_dong: ContractType | string;
  ma_hop_dong: string;
  ngay_ky: string;
  ngay_hieu_luc: string;
  ngay_ket_thuc: string | null;
  id_nhan_vien: string;
  id_chuc_vu: string;
  id_phong_ban: string;
  muc_luong: string;
  hinh_thuc_tra_luong: SalaryMode | string;
  che_do_khac: string | null;
  noi_lam_viec: string | null;
  thoi_gian_lam_viec: string | null;
  luu_y_khac: string | null;
  ghi_chu: string | null;
  trang_thai: ContractStatus | string;
  ten_nhan_vien?: string | null;
  ten_chuc_vu?: string | null;
  ten_phong_ban?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface HopDongFilters {
  columnSearch: Record<string, string>;
  loai_hop_dong: string[];
  trang_thai: string[];
  id_phong_ban: string[];
}
