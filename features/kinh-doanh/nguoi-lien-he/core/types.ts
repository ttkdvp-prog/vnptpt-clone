export interface NguoiLienHe {
  id: string;
  id_khach_hang: string;
  ho_ten: string;
  ngay_sinh: string | null;
  chuc_vu: string | null;
  so_dien_thoai: string | null;
  email: string | null;
  dia_chi: string | null;
  ghi_chu: string | null;
  ten_khach_hang?: string | null;
  ma_khach_hang?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface NguoiLienHeFilters {
  columnSearch: Record<string, string>;
  id_khach_hang: string[];
  nguoi_tao: string[];
}
