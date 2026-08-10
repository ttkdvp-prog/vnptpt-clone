import type { ActionType, PhanQuyenRow, PositionPermission, VarPhanQuyenRow } from '../core/types';
import { isApi } from '@/lib/data/config';
import { apiGetPhanQuyen, apiPutPhanQuyen, apiGetDistinctChucDanh } from '@/lib/api/he-thong';
import { MOCK_EMPLOYEES } from '@/mocks/he-thong';
import {
  aggregateVarRowsToPhanQuyenRows,
  normalizePhanQuyenRow,
  phanQuyenRowsToGrants,
  positionToMatrixRow,
  splitMatrixToVarRows,
} from '../core/map-matrix';
import { mapVarPhanQuyenFromDb } from '../core/map-from-db';
import {
  PERMISSION_FUNCTIONS,
  PERMISSION_ACTIONS,
  getAllPermissionModules,
} from '../core/permission-modules-config';
import { mapModuleKeyToDb } from '@/lib/permission-db-keys';

export const SYSTEM_MODULES_CONFIG = getAllPermissionModules().map((m) => ({
  id: m.id,
  nameKey: m.nameKey,
  allowedActions: [...PERMISSION_ACTIONS] as ActionType[],
}));

export function getModuleName(moduleId: string): string {
  const m = SYSTEM_MODULES_CONFIG.find((x) => x.id === moduleId);
  return m?.nameKey ?? moduleId;
}

function buildMockPhanQuyen(): PhanQuyenRow[] {
  const fullActions = [...PERMISSION_ACTIONS] as ActionType[];
  const now = new Date().toISOString();
  let seq = 1;
  const rows: PhanQuyenRow[] = [];
  for (const vaiTro of ['pos-1', 'pos-3']) {
    for (const m of SYSTEM_MODULES_CONFIG) {
      rows.push({
        id: String(seq++),
        vai_tro: vaiTro,
        module_key: m.id,
        phan_quyen: fullActions,
        tg_cap_nhat: now,
      });
    }
  }
  return rows;
}

let mockPhanQuyenRows: PhanQuyenRow[] = buildMockPhanQuyen();

/** Danh sách chức danh (text tự do) đang có ở nhân viên — trục vai_tro của ma trận. */
async function getDistinctChucDanh(): Promise<string[]> {
  if (isApi()) return apiGetDistinctChucDanh();
  const set = new Set<string>();
  for (const e of MOCK_EMPLOYEES) {
    if (e.chuc_danh?.trim()) set.add(e.chuc_danh.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}

async function fetchVarRowsFromApi(filters: { moduleId?: string }): Promise<VarPhanQuyenRow[]> {
  const items = await apiGetPhanQuyen({
    moduleKey: filters.moduleId ? mapModuleKeyToDb(filters.moduleId) : undefined,
  });
  return items.map((row) =>
    mapVarPhanQuyenFromDb(row as unknown as Record<string, unknown>),
  );
}

async function getAggregatedPhanQuyenRows(filters: {
  moduleId?: string;
  chucVuIds?: string[];
}): Promise<PhanQuyenRow[]> {
  if (isApi()) {
    const varRows = await fetchVarRowsFromApi({ moduleId: filters.moduleId });
    const aggregated = aggregateVarRowsToPhanQuyenRows(varRows);
    if (!filters.chucVuIds || filters.chucVuIds.length === 0) return aggregated;
    const idSet = new Set(filters.chucVuIds);
    return aggregated.filter((r) => idSet.has(r.vai_tro));
  }

  let rows = mockPhanQuyenRows;
  if (filters.chucVuIds && filters.chucVuIds.length > 0) {
    const idSet = new Set(filters.chucVuIds);
    rows = rows.filter((r) => idSet.has(r.vai_tro));
  }
  if (filters.moduleId) {
    rows = rows.filter((r) => r.module_key === filters.moduleId);
  }
  return rows.map((r) => normalizePhanQuyenRow(r));
}

/** Quyền một module cho các chức vụ — payload nhỏ hơn load toàn bộ `var_phan_quyen`. */
export async function getPhanQuyenByModule(
  moduleId: string,
  vaiTroIds: string[],
): Promise<PhanQuyenRow[]> {
  if (!moduleId || vaiTroIds.length === 0) return [];
  return getAggregatedPhanQuyenRows({ moduleId, chucVuIds: vaiTroIds });
}

export const getPhanQuyenByVaiTro = async (vaiTro: string): Promise<PhanQuyenRow[]> => {
  return getAggregatedPhanQuyenRows({ chucVuIds: [vaiTro] });
};

export const getPhanQuyenGrantsByVaiTro = async (
  vaiTro: string,
): Promise<Record<string, ActionType[]>> => {
  const rows = await getPhanQuyenByVaiTro(vaiTro);
  return phanQuyenRowsToGrants(rows);
};

/** Shell matrix: mọi chức danh đang có ở nhân viên, chưa gắn quyền module. */
export async function getRoleMatrixPositions(): Promise<PositionPermission[]> {
  const chucDanhs = await getDistinctChucDanh();
  return chucDanhs.map((cd) => positionToMatrixRow(cd, [], getModuleName));
}

/** Matrix một module — chỉ fetch quyền module đang chọn. */
export async function getRolesForModule(moduleId: string): Promise<PositionPermission[]> {
  const chucDanhs = await getDistinctChucDanh();
  const rows = await getPhanQuyenByModule(moduleId, chucDanhs);
  return chucDanhs.map((cd) => positionToMatrixRow(cd, rows, getModuleName));
}

/** Toàn bộ matrix (mọi module) — tránh dùng trên UI; giữ cho tương thích / export. */
export const getRoles = async (): Promise<PositionPermission[]> => {
  const chucDanhs = await getDistinctChucDanh();
  const rows = await getAggregatedPhanQuyenRows({ chucVuIds: chucDanhs });
  return chucDanhs.map((cd) => positionToMatrixRow(cd, rows, getModuleName));
};

async function upsertMockPhanQuyen(
  vaiTro: string,
  moduleKey: string,
  actions: ActionType[],
): Promise<void> {
  const now = new Date().toISOString();
  mockPhanQuyenRows = mockPhanQuyenRows.filter(
    (r) => !(r.vai_tro === vaiTro && r.module_key === moduleKey),
  );

  if (actions.length === 0) return;

  mockPhanQuyenRows.push({
    id: `${vaiTro}::${moduleKey}`,
    vai_tro: vaiTro,
    module_key: moduleKey,
    phan_quyen: actions,
    tg_cap_nhat: now,
  });
}

async function upsertApiPhanQuyen(
  moduleId: string,
  updates: { roleId: string; actions: ActionType[] }[],
): Promise<void> {
  const dbModuleKey = mapModuleKeyToDb(moduleId);
  const now = new Date().toISOString();
  const rows: Array<{ chuc_vu_id: string | number; quyen: string }> = [];

  for (const { roleId, actions } of updates) {
    const varRows = splitMatrixToVarRows(roleId, moduleId, actions, now);
    if (varRows.length === 0) {
      rows.push({ chuc_vu_id: roleId, quyen: '' });
      continue;
    }
    for (const vr of varRows) {
      rows.push({ chuc_vu_id: vr.chuc_vu_id, quyen: vr.quyen });
    }
  }

  await apiPutPhanQuyen({ module_key: dbModuleKey, rows });
}

export const updateModulePermissions = async (
  moduleId: string,
  updates: { roleId: string; actions: ActionType[] }[],
): Promise<void> => {
  if (isApi()) {
    await upsertApiPhanQuyen(moduleId, updates);
    return;
  }
  for (const { roleId, actions } of updates) {
    await upsertMockPhanQuyen(roleId, moduleId, actions);
  }
};

export { PERMISSION_FUNCTIONS, PERMISSION_ACTIONS, getAllPermissionModules };
export type { PermissionFunction } from '../core/permission-modules-config';
