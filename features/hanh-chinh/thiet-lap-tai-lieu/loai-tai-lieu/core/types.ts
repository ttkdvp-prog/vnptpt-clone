export interface LoaiTaiLieu {
  id: string;
  thu_tu: number;
  ten_loai_tai_lieu: string;
  mo_ta: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface LoaiTaiLieuFilters {
  columnSearch: Record<string, string>;
  nguoi_tao: string[];
}
