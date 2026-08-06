import { insertRow, nextId, readTable, deleteRowById } from '@/lib/sheets/generic-repository';
import { SHEET_TABS } from '@/lib/sheets/config';
import { formatQuyenCsv, parseQuyenCsv } from '@/lib/permission-db-keys';

const TAB = SHEET_TABS.var_phan_quyen;

export type PhanQuyenRow = {
  id: number;
  module_key: string;
  chuc_vu_id: number;
  quyen: string;
  tg_tao: Date;
  tg_cap_nhat: Date;
};

function fromSheetRow(row: Record<string, string>): PhanQuyenRow {
  return {
    id: Number(row.id),
    module_key: row.module_key ?? '',
    chuc_vu_id: Number(row.chuc_vu_id),
    quyen: row.quyen ?? '',
    tg_tao: row.tg_tao ? new Date(row.tg_tao) : new Date(0),
    tg_cap_nhat: row.tg_cap_nhat ? new Date(row.tg_cap_nhat) : new Date(0),
  };
}

export function mapPhanQuyenRow(row: PhanQuyenRow) {
  return {
    id: String(row.id),
    module_key: row.module_key,
    chuc_vu_id: String(row.chuc_vu_id),
    quyen: row.quyen,
    tg_tao: row.tg_tao.toISOString(),
    tg_cap_nhat: row.tg_cap_nhat.toISOString(),
  };
}

export async function findPhanQuyenByModule(params: {
  moduleKey: string;
  chucVuIds?: number[];
}): Promise<PhanQuyenRow[]> {
  const { rows } = await readTable(TAB);
  let items = rows.filter((r) => r.module_key === params.moduleKey);
  if (params.chucVuIds && params.chucVuIds.length > 0) {
    const idSet = new Set(params.chucVuIds);
    items = items.filter((r) => idSet.has(Number(r.chuc_vu_id)));
  }
  return items
    .map(fromSheetRow)
    .sort((a, b) => a.chuc_vu_id - b.chuc_vu_id || a.module_key.localeCompare(b.module_key));
}

export function sanitizeQuyenCsv(raw: string, opts?: { stripAdmin?: boolean }): string {
  let tokens = parseQuyenCsv(raw);
  if (opts?.stripAdmin) {
    tokens = tokens.filter((t) => t !== 'admin' && t !== 'tat_ca' && t !== 'all');
  }
  return formatQuyenCsv(tokens);
}

/** Không có transaction thật trên Sheets — xoá rồi ghi lại tuần tự cho từng chức vụ trong module. */
export async function replacePhanQuyenForModule(params: {
  moduleKey: string;
  rows: Array<{ chuc_vu_id: number; quyen: string }>;
  stripAdminOnPhanQuyen?: boolean;
}): Promise<PhanQuyenRow[]> {
  const { moduleKey, rows } = params;
  const stripAdmin = params.stripAdminOnPhanQuyen === true && moduleKey === 'phan_quyen';
  const chucVuIds = [...new Set(rows.map((r) => r.chuc_vu_id))];
  const now = new Date().toISOString();

  if (chucVuIds.length > 0) {
    const { rows: existing } = await readTable(TAB);
    const toDelete = existing.filter(
      (r) => r.module_key === moduleKey && chucVuIds.includes(Number(r.chuc_vu_id)),
    );
    for (const row of toDelete) {
      await deleteRowById(TAB, row.id);
    }
  }

  const toCreate = rows
    .map((r) => ({ chuc_vu_id: r.chuc_vu_id, quyen: sanitizeQuyenCsv(r.quyen, { stripAdmin }) }))
    .filter((r) => r.quyen.trim().length > 0);

  for (const r of toCreate) {
    const id = await nextId(TAB);
    await insertRow(TAB, {
      id: String(id),
      module_key: moduleKey,
      chuc_vu_id: String(r.chuc_vu_id),
      quyen: r.quyen,
      tg_tao: now,
      tg_cap_nhat: now,
    });
  }

  return findPhanQuyenByModule({ moduleKey, chucVuIds });
}

/**
 * Chức vụ table no longer exists in the sheet — position ids can't be validated
 * server-side anymore, so nothing is reported missing.
 */
export async function assertChucVuIdsExist(_ids: number[]): Promise<number[]> {
  return [];
}

export async function findQuyenCsvByChucVuAndModule(chucVuId: number, moduleKey: string): Promise<string> {
  const { rows } = await readTable(TAB);
  const row = rows.find((r) => Number(r.chuc_vu_id) === chucVuId && r.module_key === moduleKey);
  return row?.quyen ?? '';
}
