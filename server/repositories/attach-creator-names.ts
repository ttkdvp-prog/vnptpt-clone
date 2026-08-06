import { prisma } from '@/server/db';

type IdNameField = {
  /** Field chứa id nhân viên (number | null) */
  idKey: string;
  /** Field tên sẽ gắn vào kết quả */
  nameKey: string;
};

function collectEmployeeIds(
  rows: Record<string, unknown>[],
  fields: readonly IdNameField[],
): number[] {
  const ids = new Set<number>();
  for (const row of rows) {
    for (const { idKey } of fields) {
      const raw = row[idKey];
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        ids.add(raw);
        continue;
      }
      if (typeof raw === 'string' && raw !== '') {
        const n = Number(raw);
        if (Number.isFinite(n)) ids.add(n);
      }
    }
  }
  return [...ids];
}

/**
 * Batch-resolve tên nhân viên từ `var_nhan_vien.ho_va_ten` cho nhiều cột id trên mỗi row.
 */
export async function attachEmployeeNamesByFields<T extends Record<string, unknown>>(
  rows: T[],
  fields: readonly IdNameField[],
): Promise<(T & Record<string, string | null>)[]> {
  if (rows.length === 0 || fields.length === 0) {
    return rows.map((row) => {
      const extra: Record<string, string | null> = {};
      for (const { nameKey } of fields) extra[nameKey] = null;
      return { ...row, ...extra };
    });
  }

  const ids = collectEmployeeIds(rows as Record<string, unknown>[], fields);
  const nameById = new Map<number, string>();
  if (ids.length > 0) {
    const employees = await prisma.var_nhan_vien.findMany({
      where: { id: { in: ids } },
      select: { id: true, ho_va_ten: true },
    });
    for (const e of employees) nameById.set(e.id, e.ho_va_ten);
  }

  return rows.map((row) => {
    const extra: Record<string, string | null> = {};
    for (const { idKey, nameKey } of fields) {
      const raw = row[idKey];
      let id: number | null = null;
      if (typeof raw === 'number' && Number.isFinite(raw)) id = raw;
      else if (typeof raw === 'string' && raw !== '') {
        const n = Number(raw);
        if (Number.isFinite(n)) id = n;
      }
      extra[nameKey] = id != null ? (nameById.get(id) ?? null) : null;
    }
    return { ...row, ...extra };
  });
}

/** Batch-resolve `ten_nguoi_tao` from `var_nhan_vien.ho_va_ten` for rows that store `nguoi_tao` id. */
export async function attachCreatorNames<T extends { nguoi_tao?: number | null }>(
  rows: T[],
): Promise<(T & { ten_nguoi_tao: string | null })[]> {
  const enriched = await attachEmployeeNamesByFields(
    rows as (T & Record<string, unknown>)[],
    [{ idKey: 'nguoi_tao', nameKey: 'ten_nguoi_tao' }],
  );
  return enriched as (T & { ten_nguoi_tao: string | null })[];
}
