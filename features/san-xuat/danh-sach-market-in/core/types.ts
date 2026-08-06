/** Trạng thái workflow market in (cố định — không dùng bảng lookup). */
export const MARKET_IN_STATUS = {
  CHO_DUYET: 'cho_duyet',
  DA_DUYET: 'da_duyet',
  NGUNG_AP_DUNG: 'ngung_ap_dung',
} as const;

export type MarketInStatus = (typeof MARKET_IN_STATUS)[keyof typeof MARKET_IN_STATUS];

export const MARKET_IN_STATUS_LABELS: Record<MarketInStatus, string> = {
  cho_duyet: 'Chờ duyệt',
  da_duyet: 'Đã duyệt',
  ngung_ap_dung: 'Ngừng áp dụng',
};

export const MARKET_IN_STATUS_OPTIONS = (
  Object.keys(MARKET_IN_STATUS_LABELS) as MarketInStatus[]
).map((value) => ({ value, label: MARKET_IN_STATUS_LABELS[value] }));

export interface MarketIn {
  id: string;
  thu_tu: number;
  id_khach_hang: string;
  ma_san_pham: string;
  ma_market: string;
  mo_ta: string | null;
  link_file: string | null;
  id_nguoi_ve: string | null;
  trang_thai: MarketInStatus | string;
  ngay_hieu_luc: string | null;
  id_nguoi_duyet: string | null;
  tg_duyet: string | null;
  ten_khach_hang?: string | null;
  ma_khach_hang?: string | null;
  ten_nguoi_ve?: string | null;
  ten_nguoi_duyet?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface MarketInFilters {
  columnSearch: Record<string, string>;
  id_khach_hang: string[];
  trang_thai: string[];
  id_nguoi_ve: string[];
  nguoi_tao: string[];
}
