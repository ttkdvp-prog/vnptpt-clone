/**
 * Shared list/filter where-builder for Nhân viên (D2.1).
 * Used by page, count, filter-counts, and stats aggregates.
 */
import {
  mapNhanVienTrangThaiToApp,
  mapNhanVienTrangThaiToDb,
  toDbId,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';

export interface NhanVienListFilters {
  search?: string;
  /** App labels or DB tokens — normalized to DB in buildWhere */
  trang_thai?: string[];
  phong_ban_id?: string[];
  chuc_vu_id?: string[];
  gioi_tinh?: string[];
  /** Per-column contains (AND). Keys: app field names */
  columnSearch?: Record<string, string>;
  /** Stats: only rows with tg_tao <= asAt (inclusive end of day) */
  asAt?: Date | string | null;
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
}

export type NhanVienListFilterOmit =
  | 'trang_thai'
  | 'phong_ban_id'
  | 'chuc_vu_id'
  | 'gioi_tinh';

function parseCsvIds(values: string[] | undefined): number[] {
  if (!values?.length) return [];
  return values
    .map((v) => toDbId(v))
    .filter((n): n is number => n != null && Number.isFinite(n));
}

function normalizeTrangThaiToDb(values: string[] | undefined): string[] {
  if (!values?.length) return [];
  return values.map((v) => {
    const upper = v.toUpperCase();
    if (['ACTIVE', 'INACTIVE', 'PROBATION', 'LEAVE', 'RESIGNED'].includes(upper)) {
      return upper === 'RESIGNED' ? 'INACTIVE' : upper;
    }
    return mapNhanVienTrangThaiToDb(v);
  });
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Build Prisma where from list filters.
 * `omit` skips one chip dimension (exclude-self facet counts).
 */
export function buildEmployeeWhere(
  filters: NhanVienListFilters = {},
  omit?: NhanVienListFilterOmit,
): Prisma.var_nhan_vienWhereInput {
  const and: Prisma.var_nhan_vienWhereInput[] = [];

  const search = filters.search?.trim();
  if (search) {
    const searchOr: Prisma.var_nhan_vienWhereInput[] = [
      { ho_va_ten: { contains: search, mode: 'insensitive' } },
      { tai_khoan: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { so_dien_thoai: { contains: search, mode: 'insensitive' } },
      { gioi_tinh: { contains: search, mode: 'insensitive' } },
      { trang_thai: { contains: search, mode: 'insensitive' } },
      {
        phong_ban: { ten_phong_ban: { contains: search, mode: 'insensitive' } },
      },
      {
        chuc_vu: { ten_chuc_vu: { contains: search, mode: 'insensitive' } },
      },
    ];
    const asId = Number(search);
    if (Number.isFinite(asId) && String(asId) === search) {
      searchOr.push({ id: asId });
    }
    and.push({ OR: searchOr });
  }

  if (omit !== 'trang_thai') {
    const statuses = normalizeTrangThaiToDb(filters.trang_thai);
    if (statuses.length > 0) {
      and.push({ trang_thai: { in: statuses } });
    }
  }

  if (omit !== 'phong_ban_id') {
    const deptIds = parseCsvIds(filters.phong_ban_id);
    if (deptIds.length > 0) {
      and.push({ id_phong_ban: { in: deptIds } });
    }
  }

  if (omit !== 'chuc_vu_id') {
    const posIds = parseCsvIds(filters.chuc_vu_id);
    if (posIds.length > 0) {
      and.push({ id_chuc_vu: { in: posIds } });
    }
  }

  if (omit !== 'gioi_tinh') {
    if (filters.gioi_tinh && filters.gioi_tinh.length > 0) {
      and.push({ gioi_tinh: { in: filters.gioi_tinh } });
    }
  }

  const cs = filters.columnSearch;
  if (cs) {
    const map: Record<string, (v: string) => Prisma.var_nhan_vienWhereInput> = {
      ho_ten: (v) => ({ ho_va_ten: { contains: v, mode: 'insensitive' } }),
      ten_dang_nhap: (v) => ({ tai_khoan: { contains: v, mode: 'insensitive' } }),
      email: (v) => ({ email: { contains: v, mode: 'insensitive' } }),
      so_dien_thoai: (v) => ({ so_dien_thoai: { contains: v, mode: 'insensitive' } }),
      gioi_tinh: (v) => ({ gioi_tinh: { contains: v, mode: 'insensitive' } }),
      ten_phong_ban: (v) => ({
        phong_ban: { ten_phong_ban: { contains: v, mode: 'insensitive' } },
      }),
      ten_chuc_vu: (v) => ({
        chuc_vu: { ten_chuc_vu: { contains: v, mode: 'insensitive' } },
      }),
      ten_bo_phan: (v) => ({
        phong_ban: { ten_phong_ban: { contains: v, mode: 'insensitive' } },
      }),
      id: (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? { id: n } : { id: -1 };
      },
    };
    for (const [key, raw] of Object.entries(cs)) {
      const v = raw?.trim();
      if (!v) continue;
      const builder = map[key];
      if (builder) and.push(builder(v));
    }
  }

  const asAt = toDate(filters.asAt);
  if (asAt) {
    const end = new Date(asAt);
    end.setHours(23, 59, 59, 999);
    and.push({ tg_tao: { lte: end } });
  }

  const dateFrom = toDate(filters.dateFrom);
  const dateTo = toDate(filters.dateTo);
  if (dateFrom || dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      range.gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
    and.push({ tg_tao: range });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0]!;
  return { AND: and };
}

export function appStatusKeyFromDb(db: string): string {
  return mapNhanVienTrangThaiToApp(db);
}
