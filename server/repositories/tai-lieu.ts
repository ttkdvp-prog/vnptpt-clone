import { insertRow, nextId, readTable, updateRowById, deleteRowById } from '@/lib/sheets/generic-repository';
import { SHEET_TABS } from '@/lib/sheets/config';

const TAB = SHEET_TABS.tai_lieu;

export interface SheetTaiLieuRow {
  id: string;
  so_ho_so: string;
  ten_ho_so: string;
  danh_muc: string;
  to: string;
  ngay_ban_hanh: string;
  ngay_ket_thuc: string;
  tinh_trang: string;
  url: string;
  mo_ta: string;
  nguoi_tao: string;
  tg_tao: string;
  tg_cap_nhat: string;
}

function fromRow(r: Record<string, string>): SheetTaiLieuRow {
  return {
    id: (r.id ?? '').trim(),
    so_ho_so: r.so_ho_so ?? '',
    ten_ho_so: r.ten_ho_so ?? '',
    danh_muc: r.danh_muc ?? '',
    // Header sheet đang là "to a" (lẽ ra "to") — chấp nhận cả hai để không phụ
    // thuộc việc sửa tay trên Sheet.
    to: r.to || r['to a'] || '',
    ngay_ban_hanh: r.ngay_ban_hanh ?? '',
    ngay_ket_thuc: r.ngay_ket_thuc ?? '',
    tinh_trang: r.tinh_trang ?? '',
    url: r.url ?? '',
    mo_ta: r.mo_ta ?? '',
    nguoi_tao: r.nguoi_tao ?? '',
    tg_tao: r.tg_tao ?? '',
    // Header sheet đang là "cap_cap_nhat" (lẽ ra "tg_cap_nhat").
    tg_cap_nhat: r.tg_cap_nhat || r['cap_cap_nhat'] || '',
  };
}

async function loadRows(): Promise<SheetTaiLieuRow[]> {
  const { rows } = await readTable(TAB);
  return rows.map(fromRow);
}

export interface TaiLieuListFilters {
  search?: string;
  tinh_trang?: string[];
  danh_muc?: string[];
  to?: string[];
}

export interface TaiLieuPageQuery extends TaiLieuListFilters {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

export const TAI_LIEU_LIST_MAX_LIMIT = 100;

function matchesFilters(row: SheetTaiLieuRow, filters: TaiLieuListFilters, skip?: keyof TaiLieuListFilters): boolean {
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const haystack = `${row.ten_ho_so} ${row.so_ho_so} ${row.danh_muc}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (skip !== 'tinh_trang' && filters.tinh_trang?.length && !filters.tinh_trang.includes(row.tinh_trang)) {
    return false;
  }
  if (skip !== 'danh_muc' && filters.danh_muc?.length && !filters.danh_muc.includes(row.danh_muc)) {
    return false;
  }
  if (skip !== 'to' && filters.to?.length && !filters.to.includes(row.to)) {
    return false;
  }
  return true;
}

function sortRows(rows: SheetTaiLieuRow[], orderBy: string | undefined, ascending: boolean): SheetTaiLieuRow[] {
  const dir = ascending ? 1 : -1;
  const key = (row: SheetTaiLieuRow): string | number => {
    switch (orderBy) {
      case 'ten_ho_so':
        return row.ten_ho_so;
      case 'ngay_ban_hanh':
        return row.ngay_ban_hanh;
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

export async function findTaiLieuById(id: string): Promise<SheetTaiLieuRow | null> {
  const rows = await loadRows();
  return rows.find((r) => r.id === id) ?? null;
}

export async function countTaiLieu(filters: TaiLieuListFilters = {}): Promise<number> {
  const rows = await loadRows();
  return rows.filter((r) => matchesFilters(r, filters)).length;
}

export async function findTaiLieuPage(
  query: TaiLieuPageQuery = {},
): Promise<{ items: SheetTaiLieuRow[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), TAI_LIEU_LIST_MAX_LIMIT);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const rows = await loadRows();
  const filtered = rows.filter((r) => matchesFilters(r, query));
  const sorted = sortRows(filtered, query.orderBy, ascending);
  return { items: sorted.slice(offset, offset + limit), total: filtered.length };
}

export interface TaiLieuFilterCountsResult {
  tinhTrangCounts: Record<string, number>;
  danhMucCounts: Record<string, number>;
}

export async function getTaiLieuFilterCounts(
  filters: TaiLieuListFilters = {},
): Promise<TaiLieuFilterCountsResult> {
  const rows = await loadRows();

  const tinhTrangCounts: Record<string, number> = {};
  for (const r of rows.filter((row) => matchesFilters(row, filters, 'tinh_trang'))) {
    tinhTrangCounts[r.tinh_trang] = (tinhTrangCounts[r.tinh_trang] ?? 0) + 1;
  }

  const danhMucCounts: Record<string, number> = {};
  for (const r of rows.filter((row) => matchesFilters(row, filters, 'danh_muc'))) {
    if (!r.danh_muc) continue;
    danhMucCounts[r.danh_muc] = (danhMucCounts[r.danh_muc] ?? 0) + 1;
  }

  return { tinhTrangCounts, danhMucCounts };
}

export interface TaiLieuStatsAggregatesResult {
  kpis: {
    total: number;
    dangHieuLuc: number;
    hetHieuLuc: number;
    duThao: number;
  };
  byTinhTrang: Array<{ key: string; count: number }>;
  byDanhMuc: Array<{ key: string; count: number }>;
}

export async function getTaiLieuStatsAggregates(
  filters: TaiLieuListFilters = {},
): Promise<TaiLieuStatsAggregatesResult> {
  const allRows = await loadRows();
  const rows = allRows.filter((r) => matchesFilters(r, filters));

  const tinhTrangMap: Record<string, number> = {};
  const danhMucMap: Record<string, number> = {};
  for (const r of rows) {
    tinhTrangMap[r.tinh_trang] = (tinhTrangMap[r.tinh_trang] ?? 0) + 1;
    if (r.danh_muc) danhMucMap[r.danh_muc] = (danhMucMap[r.danh_muc] ?? 0) + 1;
  }

  return {
    kpis: {
      total: rows.length,
      dangHieuLuc: tinhTrangMap['Đang hiệu lực'] ?? 0,
      hetHieuLuc: tinhTrangMap['Hết hiệu lực'] ?? 0,
      duThao: tinhTrangMap['Dự thảo'] ?? 0,
    },
    byTinhTrang: Object.entries(tinhTrangMap).map(([key, count]) => ({ key, count })),
    byDanhMuc: Object.entries(danhMucMap).map(([key, count]) => ({ key, count })),
  };
}

/** Distinct `danh_muc` đã dùng — gợi ý cho combobox tự do (không có bảng danh mục riêng). */
export async function getDistinctDanhMuc(): Promise<string[]> {
  const rows = await loadRows();
  const set = new Set<string>();
  for (const r of rows) {
    if (r.danh_muc?.trim()) set.add(r.danh_muc.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}

/** Distinct `ten_ho_so` đã dùng — gợi ý để tái dùng tên hồ sơ đã có, tránh trùng lặp/lệch chính tả. */
export async function getDistinctTenHoSo(): Promise<string[]> {
  const rows = await loadRows();
  const set = new Set<string>();
  for (const r of rows) {
    if (r.ten_ho_so?.trim()) set.add(r.ten_ho_so.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}

/**
 * Header sheet thực tế đang lệch tên so với code (`to a` thay vì `to`,
 * `cap_cap_nhat` thay vì `tg_cap_nhat`) — dò header thật để ghi đúng cột,
 * tránh lặp lại bug ghi rỗng do key không khớp tên cột trên Sheet.
 */
async function resolveHeaderKey(candidates: string[]): Promise<string> {
  const { headers } = await readTable(TAB);
  return candidates.find((c) => headers.includes(c)) ?? candidates[0]!;
}

export interface TaiLieuCreateInput {
  ten_ho_so: string;
  danh_muc: string;
  to: string;
  ngay_ban_hanh: string;
  ngay_ket_thuc?: string | null;
  tinh_trang: string;
  url?: string | null;
  mo_ta?: string | null;
  nguoi_tao: string;
}

export type TaiLieuUpdateInput = Partial<Omit<TaiLieuCreateInput, 'nguoi_tao'>>;

export async function createTaiLieu(input: TaiLieuCreateInput): Promise<SheetTaiLieuRow> {
  const id = await nextId(TAB);
  const now = new Date().toISOString();
  const toKey = await resolveHeaderKey(['to', 'to a']);
  const tgCapNhatKey = await resolveHeaderKey(['tg_cap_nhat', 'cap_cap_nhat']);
  await insertRow(TAB, {
    id: String(id),
    // Đơn giản hóa đã chốt: so_ho_so dùng chung 1 counter với id, không đánh số lại theo năm.
    so_ho_so: String(id),
    ten_ho_so: input.ten_ho_so,
    danh_muc: input.danh_muc,
    [toKey]: input.to,
    ngay_ban_hanh: input.ngay_ban_hanh,
    ngay_ket_thuc: input.ngay_ket_thuc ?? '',
    tinh_trang: input.tinh_trang,
    url: input.url ?? '',
    mo_ta: input.mo_ta ?? '',
    nguoi_tao: input.nguoi_tao,
    tg_tao: now,
    [tgCapNhatKey]: now,
  });
  const created = await findTaiLieuById(String(id));
  if (!created) throw new Error('Failed to load created tai_lieu');
  return created;
}

export async function updateTaiLieu(id: string, input: TaiLieuUpdateInput): Promise<SheetTaiLieuRow | null> {
  const tgCapNhatKey = await resolveHeaderKey(['tg_cap_nhat', 'cap_cap_nhat']);
  const patch: Record<string, string> = { [tgCapNhatKey]: new Date().toISOString() };
  const setIf = (key: string, value: string | null | undefined) => {
    if (value !== undefined) patch[key] = value ?? '';
  };
  setIf('ten_ho_so', input.ten_ho_so);
  setIf('danh_muc', input.danh_muc);
  if (input.to !== undefined) {
    const toKey = await resolveHeaderKey(['to', 'to a']);
    patch[toKey] = input.to ?? '';
  }
  setIf('ngay_ban_hanh', input.ngay_ban_hanh);
  setIf('ngay_ket_thuc', input.ngay_ket_thuc);
  setIf('tinh_trang', input.tinh_trang);
  setIf('url', input.url);
  setIf('mo_ta', input.mo_ta);

  const ok = await updateRowById(TAB, id, patch);
  if (!ok) return null;
  return findTaiLieuById(id);
}

export async function deleteTaiLieu(id: string): Promise<boolean> {
  return deleteRowById(TAB, id);
}

export async function deleteTaiLieuMany(ids: string[]): Promise<number> {
  let count = 0;
  for (const id of ids) {
    if (await deleteRowById(TAB, id)) count += 1;
  }
  return count;
}
