import type { ActionType } from '@/features/he-thong/phan-quyen/core/types';

/** Quyền lưu trong cột CSV `var_phan_quyen.quyen` (vd. xem,them,sua,xoa). */
export const DB_QUYEN = ['xem', 'them', 'sua', 'xoa', 'admin', 'tat_ca'] as const;
export type DbQuyen = (typeof DB_QUYEN)[number];

const KNOWN_QUYEN_ORDER = ['xem', 'them', 'sua', 'xoa', 'admin', 'tat_ca'] as const;

/** Tách chuỗi quyen CSV — giữ mọi token, không lọc enum cứng. */
export function parseQuyenCsv(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(',')) {
    const token = part.trim().toLowerCase();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

/** Gộp quyền thành CSV — token đã biết theo thứ tự chuẩn, còn lại giữ nguyên. */
export function formatQuyenCsv(quyens: Iterable<string>): string {
  const tokens = parseQuyenCsv([...quyens].join(','));
  const known = KNOWN_QUYEN_ORDER.filter((q) => tokens.includes(q));
  const unknown = tokens.filter((t) => !(KNOWN_QUYEN_ORDER as readonly string[]).includes(t));
  return [...known, ...unknown].join(',');
}

const MODULE_KEY_APP_TO_DB: Record<string, string> = {
  'he-thong/nhan-vien': 'nhan_vien',
  'he-thong/phong-ban': 'phong_ban',
  'he-thong/chuc-vu': 'chuc_vu',
  'he-thong/thong-tin-cong-ty': 'thong_tin_cong_ty',
  'he-thong/phan-quyen': 'phan_quyen',
  'kinh-doanh/thiet-lap-khach-hang': 'thiet_lap_khach_hang',
  'kinh-doanh/khach-hang': 'danh_sach_khach_hang',
  'kinh-doanh/nguoi-lien-he': 'nguoi_lien_he',
  'san-xuat/danh-sach-market-in': 'danh_sach_market_in',
  'hanh-chinh/thiet-lap-tai-lieu': 'thiet_lap_tai_lieu',
  'hanh-chinh/danh-sach-tai-lieu': 'danh_sach_tai_lieu',
  'hanh-chinh/thiet-lap-cong-luong': 'thiet_lap_cong_luong',
  'hanh-chinh/phieu-hanh-chinh': 'phieu_hanh_chinh',
  'hanh-chinh/hop-dong': 'hop_dong',
  'hanh-chinh/thong-bao': 'thong_bao',
};

const MODULE_KEY_DB_TO_APP: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_KEY_APP_TO_DB).map(([app, db]) => [db, app]),
);

const ACTION_APP_TO_DB: Record<ActionType, DbQuyen> = {
  view: 'xem',
  create: 'them',
  update: 'sua',
  delete: 'xoa',
  admin: 'admin',
  all: 'tat_ca',
  approve: 'sua',
  export: 'xem',
  import: 'them',
};

const ACTION_DB_TO_APP: Partial<Record<DbQuyen, ActionType>> = {
  xem: 'view',
  them: 'create',
  sua: 'update',
  xoa: 'delete',
  admin: 'admin',
  tat_ca: 'all',
};

export function mapModuleKeyToDb(appModuleKey: string): string {
  return MODULE_KEY_APP_TO_DB[appModuleKey] ?? appModuleKey.replace(/^he-thong\//, '').replace(/-/g, '_');
}

export function mapModuleKeyToApp(dbModuleKey: string): string {
  return MODULE_KEY_DB_TO_APP[dbModuleKey] ?? dbModuleKey;
}

export function mapActionToQuyen(action: ActionType | string): DbQuyen {
  const key = action as ActionType;
  return ACTION_APP_TO_DB[key] ?? (action.toLowerCase() as DbQuyen);
}

export function mapQuyenToAction(quyen: string): ActionType | null {
  return ACTION_DB_TO_APP[quyen as DbQuyen] ?? null;
}

export function actionsToQuyenList(actions: ActionType[]): string[] {
  const out = new Set<string>();
  for (const action of actions) {
    if (action === 'all') {
      out.add('xem');
      out.add('them');
      out.add('sua');
      out.add('xoa');
      continue;
    }
    out.add(mapActionToQuyen(action));
  }
  return parseQuyenCsv(formatQuyenCsv(out));
}

export function quyenListToActions(quyens: string[]): ActionType[] {
  const out = new Set<ActionType>();
  for (const quyen of parseQuyenCsv(quyens.join(','))) {
    if (quyen === 'tat_ca') {
      out.add('all');
      continue;
    }
    const action = mapQuyenToAction(quyen);
    if (action) out.add(action);
  }
  if (
    out.has('view') &&
    out.has('create') &&
    out.has('update') &&
    out.has('delete') &&
    !out.has('all')
  ) {
    out.add('all');
  }
  return [...out];
}
