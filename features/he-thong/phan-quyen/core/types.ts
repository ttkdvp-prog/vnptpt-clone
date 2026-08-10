export type ActionType = 'view' | 'create' | 'update' | 'delete' | 'approve' | 'export' | 'import' | 'admin' | 'all';

/** Một dòng bảng `var_phan_quyen` — quyen CSV (vd. xem,them,sua,xoa). */
export interface VarPhanQuyenRow {
  id: string;
  module_key: string;
  chuc_vu_id: string;
  quyen: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

/** Ma trận UI — một dòng DB / chức vụ + module (app key). */
export interface PhanQuyenRow {
  id: string;
  vai_tro: string;
  module_key: string;
  phan_quyen: ActionType[];
  tg_cap_nhat: string;
}

export interface ModulePermission {
  module_id: string;
  module_name: string;
  actions: ActionType[];
}

/** Một dòng ma trận = một chức danh (text tự do, không có bảng tra). */
export interface PositionPermission {
  id: string;
  ten_chuc_vu: string;
  so_nhan_vien: number;
  quyen_han: ModulePermission[];
  tg_cap_nhat: string;
}
