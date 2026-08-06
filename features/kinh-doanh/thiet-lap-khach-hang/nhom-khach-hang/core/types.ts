export interface NhomKhachHang {
  id: string;
  ten_nhom: string;
  mo_ta: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface NhomKhachHangFilters {
  columnSearch: Record<string, string>;
  nguoi_tao: string[];
}
