import {
  actionsToQuyenList,
  formatQuyenCsv,
  mapModuleKeyToApp,
  mapModuleKeyToDb,
  parseQuyenCsv,
  quyenListToActions,
} from '@/lib/permission-db-keys';
import type {
  ActionType,
  ModulePermission,
  PhanQuyenRow,
  PositionPermission,
  VarPhanQuyenRow,
} from './types';

export function normalizeVarPhanQuyenRow(
  row: VarPhanQuyenRow & { id: string | number; chuc_vu_id: string | number },
): VarPhanQuyenRow {
  return {
    ...row,
    id: String(row.id),
    chuc_vu_id: String(row.chuc_vu_id),
  };
}

export function aggregateVarRowsToPhanQuyenRows(rows: VarPhanQuyenRow[]): PhanQuyenRow[] {
  const grouped = new Map<
    string,
    {
      id: string;
      vai_tro: string;
      module_key: string;
      quyens: string[];
      tg_cap_nhat: string;
    }
  >();

  for (const row of rows) {
    const appModuleKey = mapModuleKeyToApp(row.module_key);
    const vaiTro = String(row.chuc_vu_id);
    const groupKey = `${vaiTro}::${appModuleKey}`;
    const existing = grouped.get(groupKey);

    const rowQuyens = parseQuyenCsv(row.quyen);

    if (existing) {
      existing.quyens.push(...rowQuyens);
      if (row.tg_cap_nhat > existing.tg_cap_nhat) {
        existing.tg_cap_nhat = row.tg_cap_nhat;
      }
    } else {
      grouped.set(groupKey, {
        id: groupKey,
        vai_tro: vaiTro,
        module_key: appModuleKey,
        quyens: [...rowQuyens],
        tg_cap_nhat: row.tg_cap_nhat,
      });
    }
  }

  return [...grouped.values()].map((group) => ({
    id: group.id,
    vai_tro: group.vai_tro,
    module_key: group.module_key,
    phan_quyen: quyenListToActions(group.quyens),
    tg_cap_nhat: group.tg_cap_nhat,
  }));
}

export function splitMatrixToVarRows(
  chucVuId: string,
  moduleKeyApp: string,
  actions: ActionType[],
  now: string,
): Omit<VarPhanQuyenRow, 'id'>[] {
  const dbModuleKey = mapModuleKeyToDb(moduleKeyApp);
  const quyens = actionsToQuyenList(actions);

  if (quyens.length === 0) return [];

  return [
    {
      module_key: dbModuleKey,
      chuc_vu_id: chucVuId,
      quyen: formatQuyenCsv(quyens),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  ];
}

export function normalizePhanQuyenRow(row: PhanQuyenRow & { id: string | number }): PhanQuyenRow {
  return {
    ...row,
    id: String(row.id),
    phan_quyen: Array.isArray(row.phan_quyen) ? row.phan_quyen : [],
  };
}

export function rowsToQuyenHan(
  rows: PhanQuyenRow[],
  getModuleName: (moduleKey: string) => string,
): ModulePermission[] {
  return rows.map((r) => ({
    module_id: r.module_key,
    module_name: getModuleName(r.module_key),
    actions: [...r.phan_quyen],
  }));
}

/**
 * `chuc-vu` (chức vụ) đã bị xóa khỏi hệ thống. Trục vai_tro của ma trận Phân
 * quyền giờ là chính giá trị text tự do ở cột `id_chuc_vu` (chức danh) của
 * nhân viên — không có bảng tra, không có mã/phòng ban/thứ tự riêng.
 */
export function positionToMatrixRow(
  chucDanh: string,
  rows: PhanQuyenRow[],
  getModuleName: (moduleKey: string) => string,
): PositionPermission {
  const forPosition = rows.filter((r) => r.vai_tro === chucDanh);
  const latestRowTs = forPosition.reduce(
    (max, r) => (r.tg_cap_nhat > max ? r.tg_cap_nhat : max),
    '',
  );
  return {
    id: chucDanh,
    ten_chuc_vu: chucDanh,
    so_nhan_vien: 0,
    quyen_han: rowsToQuyenHan(forPosition, getModuleName),
    tg_cap_nhat: latestRowTs,
  };
}

export function phanQuyenRowsToGrants(rows: PhanQuyenRow[]): Record<string, ActionType[]> {
  const out: Record<string, ActionType[]> = {};
  for (const r of rows) {
    if (r.phan_quyen.length > 0) {
      out[r.module_key] = [...r.phan_quyen];
    }
  }
  return out;
}
