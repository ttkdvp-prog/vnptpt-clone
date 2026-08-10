import { insertRow, nextId, readTable, updateRowById, deleteRowById } from '@/lib/sheets/generic-repository';
import { SHEET_TABS } from '@/lib/sheets/config';

const TAB = SHEET_TABS.cong_viec;

export interface SheetCongViecRow {
  id: string;
  cap: string;
  tieu_de: string;
  mo_ta: string;
  to_ar: string;
  to_r: string;
  mnv_a: string;
  mnv_r: string;
  mnv_c: string;
  uu_tien: string;
  ngay_bd: string;
  ngay_kt: string;
  ghi_chu: string;
  ngay_ht: string;
  tep_dinh_kem: string;
  nguoi_tao: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

/**
 * Header thật trên sheet lệch với tên cột chuẩn hoá dùng trong code (có dấu
 * cách thay vì `_`, và `tep_doinh_kem` là lỗi chính tả có sẵn trên sheet thay
 * vì `tep_dinh_kem`). Đọc/ghi đều phải đi qua map này để không mất dữ liệu.
 */
const SHEET_HEADER_ALIASES: Record<string, string> = {
  to_ar: 'to ar',
  to_r: 'to r',
  mnv_a: 'mnv a',
  mnv_r: 'mnv r',
  mnv_c: 'mnv c',
  tep_dinh_kem: 'tep_doinh_kem',
};

function readAliased(r: Record<string, string>, key: string): string {
  const alias = SHEET_HEADER_ALIASES[key];
  return r[key] || (alias ? r[alias] : undefined) || '';
}

/** `ngay_bd`/`ngay_kt` trên sheet đang lưu `dd/mm/yyyy`; chuẩn hoá về `yyyy-mm-dd` để input date/so sánh chuỗi hoạt động đúng. */
function normalizeDate(value: string): string {
  const trimmed = value.trim();
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!m) return trimmed;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function fromRow(r: Record<string, string>): SheetCongViecRow {
  return {
    id: (r.id ?? '').trim(),
    cap: r.cap ?? '',
    tieu_de: r.tieu_de ?? '',
    mo_ta: r.mo_ta ?? '',
    to_ar: readAliased(r, 'to_ar'),
    to_r: readAliased(r, 'to_r'),
    mnv_a: readAliased(r, 'mnv_a'),
    mnv_r: readAliased(r, 'mnv_r'),
    mnv_c: readAliased(r, 'mnv_c'),
    uu_tien: r.uu_tien ?? '',
    ngay_bd: normalizeDate(r.ngay_bd ?? ''),
    ngay_kt: normalizeDate(r.ngay_kt ?? ''),
    ghi_chu: r.ghi_chu ?? '',
    ngay_ht: normalizeDate(r.ngay_ht ?? ''),
    tep_dinh_kem: readAliased(r, 'tep_dinh_kem'),
    nguoi_tao: r.nguoi_tao ?? '',
    tg_tao: r.tg_tao ?? '',
    tg_cap_nhat: r.tg_cap_nhat ?? '',
  };
}

/** Đổi các key chuẩn hoá (`to_ar`, `mnv_a`, `tep_dinh_kem`...) sang đúng tên cột thật trên sheet trước khi ghi. */
function toSheetRow(patch: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(patch)) {
    out[SHEET_HEADER_ALIASES[key] ?? key] = value;
  }
  return out;
}

async function loadRows(): Promise<SheetCongViecRow[]> {
  const { rows } = await readTable(TAB);
  return rows.map(fromRow);
}

export interface CongViecListFilters {
  search?: string;
  cap?: string[];
  uu_tien?: string[];
  to_ar?: string[];
  /** Server-side team scope — nếu set, chỉ trả dòng có to_ar hoặc to_r nằm trong danh sách. */
  scopeTeams?: string[];
}

export interface CongViecPageQuery extends CongViecListFilters {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

export const CONG_VIEC_LIST_MAX_LIMIT = 100;

function matchesFilters(row: SheetCongViecRow, filters: CongViecListFilters, skip?: keyof CongViecListFilters): boolean {
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const haystack = `${row.tieu_de} ${row.mo_ta} ${row.ghi_chu}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (skip !== 'cap' && filters.cap?.length && !filters.cap.includes(row.cap)) {
    return false;
  }
  if (skip !== 'uu_tien' && filters.uu_tien?.length && !filters.uu_tien.includes(row.uu_tien)) {
    return false;
  }
  if (skip !== 'to_ar' && filters.to_ar?.length && !filters.to_ar.includes(row.to_ar)) {
    return false;
  }
  if (filters.scopeTeams?.length) {
    const allowed = new Set(filters.scopeTeams);
    if (!allowed.has(row.to_ar) && !allowed.has(row.to_r)) return false;
  }
  return true;
}

function sortRows(rows: SheetCongViecRow[], orderBy: string | undefined, ascending: boolean): SheetCongViecRow[] {
  const dir = ascending ? 1 : -1;
  const key = (row: SheetCongViecRow): string | number => {
    switch (orderBy) {
      case 'tieu_de':
        return row.tieu_de;
      case 'ngay_kt':
        return row.ngay_kt;
      case 'ngay_bd':
        return row.ngay_bd;
      case 'tg_tao':
        return row.tg_tao;
      default:
        return Number(row.id) || 0;
    }
  };
  return [...rows].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka < kb) return -1 * dir;
    if (ka > kb) return 1 * dir;
    return 0;
  });
}

export async function findCongViecById(id: string): Promise<SheetCongViecRow | null> {
  const rows = await loadRows();
  return rows.find((r) => r.id === id) ?? null;
}

export async function countCongViec(filters: CongViecListFilters = {}): Promise<number> {
  const rows = await loadRows();
  return rows.filter((r) => matchesFilters(r, filters)).length;
}

export async function findCongViecPage(
  query: CongViecPageQuery = {},
): Promise<{ items: SheetCongViecRow[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), CONG_VIEC_LIST_MAX_LIMIT);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const rows = await loadRows();
  const filtered = rows.filter((r) => matchesFilters(r, query));
  const sorted = sortRows(filtered, query.orderBy, ascending);
  return { items: sorted.slice(offset, offset + limit), total: filtered.length };
}

export interface CongViecFilterCountsResult {
  capCounts: Record<string, number>;
  uuTienCounts: Record<string, number>;
  toArCounts: Record<string, number>;
}

export async function getCongViecFilterCounts(
  filters: CongViecListFilters = {},
): Promise<CongViecFilterCountsResult> {
  const rows = await loadRows();

  const capCounts: Record<string, number> = {};
  for (const r of rows.filter((row) => matchesFilters(row, filters, 'cap'))) {
    capCounts[r.cap] = (capCounts[r.cap] ?? 0) + 1;
  }

  const uuTienCounts: Record<string, number> = {};
  for (const r of rows.filter((row) => matchesFilters(row, filters, 'uu_tien'))) {
    uuTienCounts[r.uu_tien] = (uuTienCounts[r.uu_tien] ?? 0) + 1;
  }

  const toArCounts: Record<string, number> = {};
  for (const r of rows.filter((row) => matchesFilters(row, filters, 'to_ar'))) {
    if (!r.to_ar) continue;
    toArCounts[r.to_ar] = (toArCounts[r.to_ar] ?? 0) + 1;
  }

  return { capCounts, uuTienCounts, toArCounts };
}

export interface CongViecStatsAggregatesResult {
  kpis: {
    total: number;
    hoanThanh: number;
    quaHan: number;
    dangThucHien: number;
  };
  byCap: Array<{ key: string; count: number }>;
  byUuTien: Array<{ key: string; count: number }>;
  byNguoiPhuTrach: Array<{ key: string; count: number }>;
}

function deriveTrangThai(row: SheetCongViecRow): 'hoan_thanh' | 'qua_han' | 'dang_thuc_hien' {
  if (row.ngay_ht) return 'hoan_thanh';
  const today = new Date().toISOString().slice(0, 10);
  if (row.ngay_kt && today > row.ngay_kt) return 'qua_han';
  return 'dang_thuc_hien';
}

export async function getCongViecStatsAggregates(
  filters: CongViecListFilters = {},
): Promise<CongViecStatsAggregatesResult> {
  const allRows = await loadRows();
  const rows = allRows.filter((r) => matchesFilters(r, filters));

  const capMap: Record<string, number> = {};
  const uuTienMap: Record<string, number> = {};
  const nguoiPhuTrachMap: Record<string, number> = {};
  let hoanThanh = 0;
  let quaHan = 0;
  let dangThucHien = 0;
  for (const r of rows) {
    if (r.cap) capMap[r.cap] = (capMap[r.cap] ?? 0) + 1;
    if (r.uu_tien) uuTienMap[r.uu_tien] = (uuTienMap[r.uu_tien] ?? 0) + 1;
    if (r.mnv_a) nguoiPhuTrachMap[r.mnv_a] = (nguoiPhuTrachMap[r.mnv_a] ?? 0) + 1;
    const trangThai = deriveTrangThai(r);
    if (trangThai === 'hoan_thanh') hoanThanh += 1;
    else if (trangThai === 'qua_han') quaHan += 1;
    else dangThucHien += 1;
  }

  return {
    kpis: { total: rows.length, hoanThanh, quaHan, dangThucHien },
    byCap: Object.entries(capMap).map(([key, count]) => ({ key, count })),
    byUuTien: Object.entries(uuTienMap).map(([key, count]) => ({ key, count })),
    byNguoiPhuTrach: Object.entries(nguoiPhuTrachMap).map(([key, count]) => ({ key, count })),
  };
}

/** Distinct `tieu_de` đã dùng — gợi ý tự động tái dùng tiêu đề đã có. */
export async function getDistinctTieuDe(): Promise<string[]> {
  const rows = await loadRows();
  const set = new Set<string>();
  for (const r of rows) {
    if (r.tieu_de?.trim()) set.add(r.tieu_de.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}

export interface CongViecCreateInput {
  cap: string;
  tieu_de: string;
  mo_ta?: string | null;
  to_ar: string;
  to_r?: string | null;
  mnv_a: string;
  mnv_r?: string | null;
  mnv_c?: string | null;
  uu_tien: string;
  ngay_bd: string;
  ngay_kt: string;
  ghi_chu?: string | null;
  ngay_ht?: string | null;
  tep_dinh_kem?: string | null;
  nguoi_tao: string;
}

export type CongViecUpdateInput = Partial<Omit<CongViecCreateInput, 'nguoi_tao'>>;

export async function createCongViec(input: CongViecCreateInput): Promise<SheetCongViecRow> {
  const id = await nextId(TAB);
  const now = new Date().toISOString();
  await insertRow(TAB, toSheetRow({
    id: String(id),
    cap: input.cap,
    tieu_de: input.tieu_de,
    mo_ta: input.mo_ta ?? '',
    to_ar: input.to_ar,
    to_r: input.to_r ?? '',
    mnv_a: input.mnv_a,
    mnv_r: input.mnv_r ?? '',
    mnv_c: input.mnv_c ?? '',
    uu_tien: input.uu_tien,
    ngay_bd: input.ngay_bd,
    ngay_kt: input.ngay_kt,
    ghi_chu: input.ghi_chu ?? '',
    ngay_ht: input.ngay_ht ?? '',
    tep_dinh_kem: input.tep_dinh_kem ?? '',
    nguoi_tao: input.nguoi_tao,
    tg_tao: now,
    tg_cap_nhat: now,
  }));
  const created = await findCongViecById(String(id));
  if (!created) throw new Error('Failed to load created cong_viec');
  return created;
}

export async function updateCongViec(id: string, input: CongViecUpdateInput): Promise<SheetCongViecRow | null> {
  const patch: Record<string, string> = { tg_cap_nhat: new Date().toISOString() };
  const setIf = (key: string, value: string | null | undefined) => {
    if (value !== undefined) patch[key] = value ?? '';
  };
  setIf('cap', input.cap);
  setIf('tieu_de', input.tieu_de);
  setIf('mo_ta', input.mo_ta);
  setIf('to_ar', input.to_ar);
  setIf('to_r', input.to_r);
  setIf('mnv_a', input.mnv_a);
  setIf('mnv_r', input.mnv_r);
  setIf('mnv_c', input.mnv_c);
  setIf('uu_tien', input.uu_tien);
  setIf('ngay_bd', input.ngay_bd);
  setIf('ngay_kt', input.ngay_kt);
  setIf('ghi_chu', input.ghi_chu);
  setIf('ngay_ht', input.ngay_ht);
  setIf('tep_dinh_kem', input.tep_dinh_kem);

  const ok = await updateRowById(TAB, id, toSheetRow(patch));
  if (!ok) return null;
  return findCongViecById(id);
}

export async function deleteCongViec(id: string): Promise<boolean> {
  return deleteRowById(TAB, id);
}

export async function deleteCongViecMany(ids: string[]): Promise<number> {
  let count = 0;
  for (const id of ids) {
    if (await deleteRowById(TAB, id)) count += 1;
  }
  return count;
}
