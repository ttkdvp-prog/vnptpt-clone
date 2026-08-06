export interface ThongBao {
  id: string;
  tg_dang: string;
  tieu_de: string;
  noi_dung: string;
  id_chuc_vu: string[];
  ten_chuc_vu?: string[];
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

/** Phạm vi phân quyền xem trên filter chip. */
export const ANNOUNCEMENT_AUDIENCE = {
  ALL: 'tat_ca',
  BY_POSITION: 'theo_chuc_vu',
} as const;

export type AnnouncementAudience =
  (typeof ANNOUNCEMENT_AUDIENCE)[keyof typeof ANNOUNCEMENT_AUDIENCE];

export interface ThongBaoFilters {
  columnSearch: Record<string, string>;
  /** Chức vụ được gán trên thông báo */
  id_chuc_vu: string[];
  /** Người tạo */
  nguoi_tao: string[];
  /** `tat_ca` | `theo_chuc_vu` */
  pham_vi: string[];
  /** DateRangePicker preset — `all` = không lọc ngày */
  date_preset: string;
  date_custom_start: string;
  date_custom_end: string;
}
