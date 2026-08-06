export interface KhachHang {
  id: string;
  ma_khach_hang: string;
  ten_khach_hang: string;
  so_dien_thoai: string | null;
  dia_chi: string | null;
  ghi_chu: string | null;
  id_nhom: string;
  id_trang_thai: string;
  ten_nhom?: string | null;
  ten_trang_thai?: string | null;
  so_nguoi_lien_he: number;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface KhachHangFilters {
  columnSearch: Record<string, string>;
  id_nhom: string[];
  id_trang_thai: string[];
  nguoi_tao: string[];
}
