import {
  insertRow,
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

/** Chuẩn hoá `cap` về 'Trung tâm' | 'Tổ' — sheet có lẫn cách viết hoa/thường khác nhau (VD: "trung tâm"). */
function normalizeCap(raw: string | null | undefined): string | null {
  const v = raw?.trim().toLowerCase();
  if (!v) return null;
  if (v === 'trung tâm') return 'Trung tâm';
  if (v === 'tổ') return 'Tổ';
  return raw!.trim();
}

/**
 * Parsed row shape used across this file.
 *
 * `id_chuc_vu` / `id_phong_ban`: tên cột giữ nguyên từ sheet nhưng giá trị là
 * TEXT TỰ DO (chức danh, tên tổ/phòng) — không phải khóa ngoại, không có bảng
 * tra tên (var_chuc_vu / var_phong_ban đã bị xóa khỏi sheet thật).
 */
export interface SheetNhanVienRow {
  id: string;
  ho_va_ten: string;
  hinh_anh: string | null;
  trang_thai: string;
  id_chuc_vu: string | null;
  id_phong_ban: string | null;
  mat_khau: string;
  must_change_password: boolean;
  /** Cột `role` trong sheet — 'admin' mở toàn quyền phân quyền, mặc định 'user'. */
  role: 'admin' | 'user';
  email: string;
  /** Cấp nhân viên — 'Trung tâm' | 'Tổ', dùng để lọc người theo cấp ở form Công việc. */
  cap: string | null;
  /** Cột `ten_tai_khoan` trong sheet — tên đăng nhập app, so khớp không phân biệt hoa/thường. */
  ten_dang_nhap: string;
}

async function loadRows(): Promise<SheetNhanVienRow[]> {
  const { rows } = await readTable(TAB);

  return rows.map((r) => ({
    id: (r.id ?? '').trim(),
    ho_va_ten: r.ho_va_ten ?? '',
    hinh_anh: r.hinh_anh || null,
    trang_thai: r.trang_thai || 'ACTIVE',
    id_chuc_vu: r.id_chuc_vu?.trim() || null,
    id_phong_ban: r.id_phong_ban?.trim() || null,
    mat_khau: r.mat_khau ?? '',
    must_change_password: r.must_change_password === 'true' || r.must_change_password === '1',
    role: String(r.role ?? '').trim().toLowerCase() === 'admin' ? 'admin' : 'user',
    email: (r.email ?? '').trim().toLowerCase(),
    cap: normalizeCap(r.cap),
    ten_dang_nhap: (r.ten_tai_khoan ?? '').trim().toLowerCase(),
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
  id: string;
  ho_ten: string;
  mat_khau_hash: string;
  trang_thai?: string;
  anh_dai_dien?: string | null;
  chuc_danh?: string | null;
  to_phong?: string | null;
  must_change_password?: boolean;
  ten_dang_nhap?: string | null;
}

export type NhanVienUpdateInput = Partial<Omit<NhanVienCreateInput, 'mat_khau_hash' | 'id'>> & {
  mat_khau_hash?: string;
};

function sortRows(rows: SheetNhanVienRow[], orderBy: string | undefined, ascending: boolean): SheetNhanVienRow[] {
  const dir = ascending ? 1 : -1;
  const key = (row: SheetNhanVienRow): string => {
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

export async function findEmployeeById(id: string): Promise<AppEmployee | null> {
  const rows = await loadRows();
  const row = rows.find((r) => r.id === id);
  return row ? mapEmployeeFromDb(toDbNhanVien(row)) : null;
}

export async function findEmployeesByIds(ids: string[]): Promise<AppEmployee[]> {
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

/** Mọi giá trị `id_chuc_vu` (chức danh) khác nhau đang có ở nhân viên — trục vai_tro cho ma trận Phân quyền. */
export async function getDistinctChucDanh(): Promise<string[]> {
  const rows = await loadRows();
  const set = new Set<string>();
  for (const r of rows) {
    if (r.id_chuc_vu?.trim()) set.add(r.id_chuc_vu.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}

/** Mọi giá trị `id_phong_ban` (tổ/phòng) khác nhau đang có ở nhân viên — nguồn dropdown `to` của module Tài liệu. */
export async function getDistinctIdPhongBan(): Promise<string[]> {
  const rows = await loadRows();
  const set = new Set<string>();
  for (const r of rows) {
    if (r.id_phong_ban?.trim()) set.add(r.id_phong_ban.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}

export async function createEmployee(input: NhanVienCreateInput): Promise<AppEmployee> {
  await insertRow(TAB, {
    id: input.id,
    ho_va_ten: input.ho_ten,
    hinh_anh: input.anh_dai_dien ?? '',
    trang_thai: mapNhanVienTrangThaiToDb(input.trang_thai ?? 'Đang làm việc'),
    id_chuc_vu: input.chuc_danh ?? '',
    id_phong_ban: input.to_phong ?? '',
    mat_khau: input.mat_khau_hash,
    must_change_password: String(input.must_change_password ?? true),
    ten_tai_khoan: input.ten_dang_nhap ?? '',
  });
  const employee = await findEmployeeById(input.id);
  if (!employee) throw new Error('Failed to load created employee');
  return employee;
}

export async function updateEmployee(id: string, input: NhanVienUpdateInput): Promise<AppEmployee | null> {
  const patch: Record<string, string> = {};
  const setIf = (key: string, value: string | null | undefined) => {
    if (value !== undefined) patch[key] = value ?? '';
  };
  setIf('ho_va_ten', input.ho_ten);
  setIf('mat_khau', input.mat_khau_hash);
  setIf('id_chuc_vu', input.chuc_danh);
  setIf('id_phong_ban', input.to_phong);
  setIf('ten_tai_khoan', input.ten_dang_nhap);
  if (input.trang_thai != null) patch.trang_thai = mapNhanVienTrangThaiToDb(input.trang_thai);
  if (input.anh_dai_dien !== undefined) patch.hinh_anh = input.anh_dai_dien ?? '';
  if (input.must_change_password != null) patch.must_change_password = String(input.must_change_password);

  const ok = await updateRowById(TAB, id, patch);
  if (!ok) return null;
  return findEmployeeById(id);
}

export async function deleteEmployee(id: string): Promise<boolean> {
  return deleteRowById(TAB, id);
}

export async function updateEmployeeStatusMany(ids: string[], trangThai: string): Promise<AppEmployee[]> {
  const dbStatus = mapNhanVienTrangThaiToDb(trangThai);
  for (const id of ids) {
    await updateRowById(TAB, id, { trang_thai: dbStatus });
  }
  return findEmployeesByIds(ids);
}

export async function deleteEmployeesMany(ids: string[]): Promise<number> {
  let count = 0;
  for (const id of ids) {
    if (await deleteRowById(TAB, id)) count += 1;
  }
  return count;
}

export type EmployeeAuthCredential = {
  id: string;
  ho_va_ten: string;
  hinh_anh: string | null;
  trang_thai: string;
  mat_khau: string;
  must_change_password: boolean;
  role: 'admin' | 'user';
};

function toAuthCredential(row: SheetNhanVienRow): EmployeeAuthCredential {
  return {
    id: row.id,
    ho_va_ten: row.ho_va_ten,
    hinh_anh: row.hinh_anh,
    trang_thai: row.trang_thai,
    mat_khau: row.mat_khau,
    must_change_password: row.must_change_password,
    role: row.role,
  };
}

export async function findEmployeeAuthById(id: string): Promise<EmployeeAuthCredential | null> {
  const rows = await loadRows();
  const row = rows.find((r) => r.id === id);
  return row ? toAuthCredential(row) : null;
}

/** Đăng nhập bằng email (cột `email` trên sheet `var_nhan_vien`) — so khớp không phân biệt hoa/thường. */
export async function findEmployeeAuthByEmail(email: string): Promise<EmployeeAuthCredential | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const rows = await loadRows();
  const row = rows.find((r) => r.email === normalized);
  return row ? toAuthCredential(row) : null;
}

/** Đăng nhập bằng tên tài khoản (cột `ten_tai_khoan` trên sheet `var_nhan_vien`) — so khớp không phân biệt hoa/thường. */
export async function findEmployeeAuthByTenDangNhap(
  tenDangNhap: string,
): Promise<EmployeeAuthCredential | null> {
  const normalized = tenDangNhap.trim().toLowerCase();
  if (!normalized) return null;
  const rows = await loadRows();
  const row = rows.find((r) => r.ten_dang_nhap === normalized);
  return row ? toAuthCredential(row) : null;
}

export async function findEmployeePasswordHash(id: string): Promise<{ id: string; mat_khau: string } | null> {
  const rows = await loadRows();
  const row = rows.find((r) => r.id === id);
  return row ? { id: row.id, mat_khau: row.mat_khau } : null;
}

export async function updateEmployeePassword(id: string, matKhauHash: string): Promise<void> {
  await updateRowById(TAB, id, {
    mat_khau: matKhauHash,
    must_change_password: 'false',
  });
}
