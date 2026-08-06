import type { ActionType, PhanQuyenRow, PositionPermission, VarPhanQuyenRow } from '../core/types';
import { isApi } from '@/lib/data/config';
import { apiGetPhanQuyen, apiPutPhanQuyen } from '@/lib/api/he-thong';
import { getActivePositions } from '@/features/he-thong/chuc-vu/services/chuc-vu-service';
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

async function fetchVarRowsFromApi(filters: {
  moduleId?: string;
  chucVuIds?: string[];
}): Promise<VarPhanQuyenRow[]> {
  const items = await apiGetPhanQuyen({
    moduleKey: filters.moduleId ? mapModuleKeyToDb(filters.moduleId) : undefined,
    chucVuIds: filters.chucVuIds,
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
    const varRows = await fetchVarRowsFromApi(filters);
    return aggregateVarRowsToPhanQuyenRows(varRows);
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

/** Shell matrix: chức vụ active, chưa gắn quyền module. */
export async function getRoleMatrixPositions(): Promise<PositionPermission[]> {
  const positions = await getActivePositions();
  return positions.map((p) => positionToMatrixRow(p, [], getModuleName));
}

/** Matrix một module — chỉ fetch quyền module đang chọn. */
export async function getRolesForModule(moduleId: string): Promise<PositionPermission[]> {
  const positions = await getActivePositions();
  const vaiTroIds = positions.map((p) => p.id);
  const rows = await getPhanQuyenByModule(moduleId, vaiTroIds);
  return positions.map((p) => positionToMatrixRow(p, rows, getModuleName));
}

/** Toàn bộ matrix (mọi module) — tránh dùng trên UI; giữ cho tương thích / export. */
export const getRoles = async (): Promise<PositionPermission[]> => {
  const positions = await getActivePositions();
  const vaiTroIds = positions.map((p) => p.id);
  const rows = await getAggregatedPhanQuyenRows({ chucVuIds: vaiTroIds });
  return positions.map((p) => positionToMatrixRow(p, rows, getModuleName));
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
