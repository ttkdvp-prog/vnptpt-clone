/**
 * Shared list/filter predicate for Nhân viên (D2.1) — Google Sheets backend.
 * Rows are plain objects (from `generic-repository`), filtered in-memory
 * (thay Prisma where clause vì Sheets không query được ở server).
 */
import { mapNhanVienTrangThaiToApp, mapNhanVienTrangThaiToDb } from '@/server/mappers';
import type { SheetNhanVienRow } from '@/server/repositories/nhan-vien';

export interface NhanVienListFilters {
  search?: string;
  trang_thai?: string[];
  columnSearch?: Record<string, string>;
  asAt?: Date | string | null;
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
}

export type NhanVienListFilterOmit = 'trang_thai';

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

function contains(haystack: string | null | undefined, needle: string): boolean {
  return (haystack ?? '').toLowerCase().includes(needle.toLowerCase());
}

/** Build a predicate over rows. */
export function buildEmployeePredicate(
  filters: NhanVienListFilters = {},
  omit?: NhanVienListFilterOmit,
): (row: SheetNhanVienRow) => boolean {
  const search = filters.search?.trim();
  const statuses = omit === 'trang_thai' ? [] : normalizeTrangThaiToDb(filters.trang_thai);
  const cs = filters.columnSearch ?? {};

  return (row: SheetNhanVienRow): boolean => {
    if (search) {
      const idMatch = contains(row.id, search);
      const textMatch = contains(row.ho_va_ten, search) || contains(row.trang_thai, search);
      if (!idMatch && !textMatch) return false;
    }
    if (statuses.length > 0 && !statuses.includes(row.trang_thai)) return false;

    for (const [key, raw] of Object.entries(cs)) {
      const v = raw?.trim();
      if (!v) continue;
      switch (key) {
        case 'ho_ten':
          if (!contains(row.ho_va_ten, v)) return false;
          break;
        case 'id':
          if (!contains(row.id, v)) return false;
          break;
        default:
          break;
      }
    }

    return true;
  };
}

export function appStatusKeyFromDb(db: string): string {
  return mapNhanVienTrangThaiToApp(db);
}
