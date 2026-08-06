export interface TrangThaiKhachHang {
  id: string;
  ten_trang_thai: string;
  mo_ta: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface TrangThaiKhachHangFilters {
  columnSearch: Record<string, string>;
  nguoi_tao: string[];
}
