import {
  insertRow,
  nextId,
  readTable,
  updateRowById,
  deleteRowById,
} from '@/lib/sheets/generic-repository';
import { SHEET_TABS } from '@/lib/sheets/config';
import {
  mapEmployeeFromDb,
  mapNhanVienTrangThaiToDb,
  type AppEmployee,
  type DbNhanVien,
} from '@/server/mappers';
import {
  appStatusKeyFromDb,
  buildEmployeePredicate,
  type NhanVienListFilters,
} from '@/server/repositories/nhan-vien-list-query';

const TAB = SHEET_TABS.var_nhan_vien;

/** Parsed row shape used across this file. */
export interface SheetNhanVienRow {
  id: number;
  ho_va_ten: string;
  hinh_anh: string | null;
  trang_thai: string;
  mat_khau: string;
  must_change_password: boolean;
}

async function loadRows(): Promise<SheetNhanVienRow[]> {
  const { rows } = await readTable(TAB);

  return rows.map((r) => ({
    id: Number(r.id),
    ho_va_ten: r.ho_va_ten ?? '',
    hinh_anh: r.hinh_anh || null,
    trang_thai: r.trang_thai || 'ACTIVE',
    mat_khau: r.mat_khau ?? '',
    must_change_password: r.must_change_password === 'true' || r.must_change_password === '1',
  }));
}

function toDbNhanVien(row: SheetNhanVienRow): DbNhanVien {
  return { ...row };
}

export interface NhanVienPageQuery extends NhanVienListFilters {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

export const NHAN_VIEN_LIST_MAX_LIMIT = 100;

export interface NhanVienFilterCountsResult {
  statusCounts: Record<string, number>;
}

export interface NhanVienStatsAggregatesResult {
  kpis: {
    total: number;
    active: number;
    probation: number;
    inactive: number;
    hiredThisMonth: number;
    hiredPrevMonth: number;
  };
  byStatus: Array<{ key: string; count: number }>;
}

export interface NhanVienCreateInput {
  ho_ten: string;
  mat_khau_hash: string;
  trang_thai?: string;
  anh_dai_dien?: string | null;
  must_change_password?: boolean;
}

export type NhanVienUpdateInput = Partial<Omit<NhanVienCreateInput, 'mat_khau_hash'>> & {
  mat_khau_hash?: string;
};

function sortRows(rows: SheetNhanVienRow[], orderBy: string | undefined, ascending: boolean): SheetNhanVienRow[] {
  const dir = ascending ? 1 : -1;
  const key = (row: SheetNhanVienRow): string | number => {
    switch (orderBy) {
      case 'ho_ten':
      case 'ho_va_ten':
        return row.ho_va_ten;
      default:
        return row.id;
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

export async function findEmployeeById(id: number): Promise<AppEmployee | null> {
  const rows = await loadRows();
  const row = rows.find((r) => r.id === id);
  return row ? mapEmployeeFromDb(toDbNhanVien(row)) : null;
}

export async function findEmployeesByIds(ids: number[]): Promise<AppEmployee[]> {
  if (ids.length === 0) return [];
  const rows = await loadRows();
  const idSet = new Set(ids);
  return rows.filter((r) => idSet.has(r.id)).map((r) => mapEmployeeFromDb(toDbNhanVien(r)));
}

export async function countEmployees(filters: NhanVienListFilters = {}): Promise<number> {
  const rows = await loadRows();
  return rows.filter(buildEmployeePredicate(filters)).length;
}

export async function findEmployeesPage(
  query: NhanVienPageQuery = {},
): Promise<{ items: AppEmployee[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), NHAN_VIEN_LIST_MAX_LIMIT);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const rows = await loadRows();
  const filtered = rows.filter(buildEmployeePredicate(query));
  const sorted = sortRows(filtered, query.orderBy, ascending);
  const page = sorted.slice(offset, offset + limit);
  return { items: page.map((r) => mapEmployeeFromDb(toDbNhanVien(r))), total: filtered.length };
}

export async function getEmployeeFilterCounts(
  filters: NhanVienListFilters = {},
): Promise<NhanVienFilterCountsResult> {
  const rows = await loadRows();

  const statusCounts: Record<string, number> = {};
  for (const r of rows.filter(buildEmployeePredicate(filters, 'trang_thai'))) {
    const key = appStatusKeyFromDb(r.trang_thai);
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  return { statusCounts };
}

export async function getEmployeeStatsAggregates(
  filters: NhanVienListFilters = {},
): Promise<NhanVienStatsAggregatesResult> {
  const allRows = await loadRows();
  const rows = allRows.filter(buildEmployeePredicate(filters));

  const total = rows.length;
  const active = rows.filter((r) => r.trang_thai === 'ACTIVE').length;
  const probation = rows.filter((r) => r.trang_thai === 'PROBATION').length;
  const leave = rows.filter((r) => r.trang_thai === 'LEAVE').length;
  const inactive = rows.filter((r) => r.trang_thai === 'INACTIVE').length;

  const statusMap: Record<string, number> = {};
  for (const r of rows) {
    const key = appStatusKeyFromDb(r.trang_thai);
    statusMap[key] = (statusMap[key] ?? 0) + 1;
  }
  const byStatus = Object.entries(statusMap).map(([key, count]) => ({ key, count }));

  return {
    kpis: { total, active, probation, inactive: inactive + leave, hiredThisMonth: 0, hiredPrevMonth: 0 },
    byStatus,
  };
}

export async function createEmployee(input: NhanVienCreateInput): Promise<AppEmployee> {
  const id = await nextId(TAB);
  await insertRow(TAB, {
    id: String(id),
    ho_va_ten: input.ho_ten,
    hinh_anh: input.anh_dai_dien ?? '',
    trang_thai: mapNhanVienTrangThaiToDb(input.trang_thai ?? 'Đang làm việc'),
    mat_khau: input.mat_khau_hash,
    must_change_password: String(input.must_change_password ?? true),
  });
  const employee = await findEmployeeById(id);
  if (!employee) throw new Error('Failed to load created employee');
  return employee;
}

export async function updateEmployee(id: number, input: NhanVienUpdateInput): Promise<AppEmployee | null> {
  const patch: Record<string, string> = {};
  const setIf = (key: string, value: string | null | undefined) => {
    if (value !== undefined) patch[key] = value ?? '';
  };
  setIf('ho_va_ten', input.ho_ten);
  setIf('mat_khau', input.mat_khau_hash);
  if (input.trang_thai != null) patch.trang_thai = mapNhanVienTrangThaiToDb(input.trang_thai);
  if (input.anh_dai_dien !== undefined) patch.hinh_anh = input.anh_dai_dien ?? '';
  if (input.must_change_password != null) patch.must_change_password = String(input.must_change_password);

  const ok = await updateRowById(TAB, id, patch);
  if (!ok) return null;
  return findEmployeeById(id);
}

export async function deleteEmployee(id: number): Promise<boolean> {
  return deleteRowById(TAB, id);
}

export async function updateEmployeeStatusMany(ids: number[], trangThai: string): Promise<AppEmployee[]> {
  const dbStatus = mapNhanVienTrangThaiToDb(trangThai);
  for (const id of ids) {
    await updateRowById(TAB, id, { trang_thai: dbStatus });
  }
  return findEmployeesByIds(ids);
}

export async function deleteEmployeesMany(ids: number[]): Promise<number> {
  let count = 0;
  for (const id of ids) {
    if (await deleteRowById(TAB, id)) count += 1;
  }
  return count;
}

export type EmployeeAuthCredential = {
  id: number;
  ho_va_ten: string;
  hinh_anh: string | null;
  trang_thai: string;
  mat_khau: string;
  must_change_password: boolean;
};

function toAuthCredential(row: SheetNhanVienRow): EmployeeAuthCredential {
  return {
    id: row.id,
    ho_va_ten: row.ho_va_ten,
    hinh_anh: row.hinh_anh,
    trang_thai: row.trang_thai,
    mat_khau: row.mat_khau,
    must_change_password: row.must_change_password,
  };
}

export async function findEmployeeAuthById(id: number): Promise<EmployeeAuthCredential | null> {
  const rows = await loadRows();
  const row = rows.find((r) => r.id === id);
  return row ? toAuthCredential(row) : null;
}

export async function findEmployeePasswordHash(id: number): Promise<{ id: number; mat_khau: string } | null> {
  const rows = await loadRows();
  const row = rows.find((r) => r.id === id);
  return row ? { id: row.id, mat_khau: row.mat_khau } : null;
}

export async function updateEmployeePassword(id: number, matKhauHash: string): Promise<void> {
  await updateRowById(TAB, id, {
    mat_khau: matKhauHash,
    must_change_password: 'false',
  });
}
