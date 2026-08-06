import { prisma } from '@/server/db';
import {
  enrichDepartmentsHierarchy,
  mapPhongBanTrangThaiToDb,
  toDbId,
  type AppDepartment,
  type DbPhongBan,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';

function toDbPhongBan(row: {
  id: number;
  ma_phong_ban: string;
  ten_phong_ban: string;
  id_cha: number | null;
  trang_thai: string;
  mo_ta: string | null;
  thu_tu: number;
  nguoi_tao: number | null;
  tg_tao: Date;
  tg_cap_nhat: Date;
}): DbPhongBan {
  return row;
}

export interface PhongBanPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}

export interface PhongBanCreateInput {
  ma_phong_ban: string;
  ten_phong_ban: string;
  cha_id?: string | null;
  trang_thai?: string;
  mo_ta?: string | null;
  thu_tu?: number;
  nguoi_tao?: string | null;
}

export interface PhongBanUpdateInput {
  ma_phong_ban?: string;
  ten_phong_ban?: string;
  cha_id?: string | null;
  trang_thai?: string;
  mo_ta?: string | null;
  thu_tu?: number;
}

function sortDepartments(
  items: AppDepartment[],
  orderBy: string | undefined,
  ascending: boolean,
): AppDepartment[] {
  const dir = ascending ? 1 : -1;
  const key = (orderBy ?? 'thu_tu') as keyof AppDepartment;
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av ?? '').localeCompare(String(bv ?? ''), 'vi') * dir;
  });
}

async function loadAllEnriched(): Promise<AppDepartment[]> {
  const rows = await prisma.var_phong_ban.findMany({ orderBy: { id: 'asc' } });
  return enrichDepartmentsHierarchy(rows.map(toDbPhongBan));
}

export async function findDepartmentById(id: number): Promise<AppDepartment | null> {
  const all = await loadAllEnriched();
  return all.find((d) => d.id === String(id)) ?? null;
}

export async function findDepartmentsPage(
  query: PhongBanPageQuery = {},
): Promise<{ items: AppDepartment[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const search = query.search?.trim().toLowerCase();

  let items = await loadAllEnriched();
  if (search) {
    items = items.filter(
      (d) =>
        d.ma_phong_ban.toLowerCase().includes(search) ||
        d.ten_phong_ban.toLowerCase().includes(search) ||
        (d.mo_ta ?? '').toLowerCase().includes(search),
    );
  }
  items = sortDepartments(items, query.orderBy, ascending);
  const total = items.length;
  return { items: items.slice(offset, offset + limit), total };
}

export async function createDepartment(input: PhongBanCreateInput): Promise<AppDepartment> {
  const now = new Date();
  const inserted = await prisma.var_phong_ban.create({
    data: {
      ma_phong_ban: input.ma_phong_ban,
      ten_phong_ban: input.ten_phong_ban,
      id_cha: toDbId(input.cha_id),
      trang_thai: mapPhongBanTrangThaiToDb(input.trang_thai ?? 'Đang hoạt động'),
      mo_ta: input.mo_ta ?? null,
      thu_tu: input.thu_tu ?? 0,
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findDepartmentById(inserted.id);
  if (!item) throw new Error('Failed to load created department');
  return item;
}

export async function updateDepartment(
  id: number,
  input: PhongBanUpdateInput,
): Promise<AppDepartment | null> {
  const existing = await prisma.var_phong_ban.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.var_phong_ban.update({
    where: { id },
    data: {
      ...(input.ma_phong_ban != null ? { ma_phong_ban: input.ma_phong_ban } : {}),
      ...(input.ten_phong_ban != null ? { ten_phong_ban: input.ten_phong_ban } : {}),
      ...(input.cha_id !== undefined ? { id_cha: toDbId(input.cha_id) } : {}),
      ...(input.trang_thai != null
        ? { trang_thai: mapPhongBanTrangThaiToDb(input.trang_thai) }
        : {}),
      ...(input.mo_ta !== undefined ? { mo_ta: input.mo_ta } : {}),
      ...(input.thu_tu != null ? { thu_tu: input.thu_tu } : {}),
      tg_cap_nhat: new Date(),
    } satisfies Prisma.var_phong_banUpdateInput,
  });

  return findDepartmentById(id);
}

export async function deleteDepartment(id: number): Promise<{ ok: true } | { error: string }> {
  const childCount = await prisma.var_phong_ban.count({ where: { id_cha: id } });
  if (childCount > 0) {
    return { error: 'Không thể xóa phòng ban còn phòng con' };
  }
  try {
    await prisma.var_phong_ban.delete({ where: { id } });
    return { ok: true };
  } catch {
    return { error: 'Not found' };
  }
}

/** Đổi trạng thái nhiều phòng ban trong 1 lệnh — tránh N request PATCH đơn lẻ. */
export async function updateDepartmentStatusMany(
  ids: number[],
  trangThai: string,
): Promise<AppDepartment[]> {
  await prisma.var_phong_ban.updateMany({
    where: { id: { in: ids } },
    data: { trang_thai: mapPhongBanTrangThaiToDb(trangThai), tg_cap_nhat: new Date() },
  });
  const all = await loadAllEnriched();
  return all.filter((d) => ids.includes(Number(d.id)));
}

/**
 * Xóa nhiều phòng ban — bỏ qua (không xóa) phòng ban còn phòng con, trả về id
 * bị bỏ qua.
 *
 * Bọc trong một transaction Serializable: kiểm-rồi-xoá (check-then-act) ở mức
 * READ COMMITTED có race thật — FK `id_cha` là `ON DELETE SET NULL`
 * (20260729120000_chuc_vu_phong_ban_nullable), nên một phòng con được TẠO đúng
 * lúc giữa bước đếm và bước xoá không hề lỗi FK: nó bị âm thầm đẩy lên thành
 * phòng gốc, không dấu vết. Serializable khiến Postgres SSI abort giao dịch bị
 * xung đột thay vì cho qua âm thầm; retry một lần khi gặp P2034 (serialization
 * failure) vì đây là lỗi tạm thời, thử lại là đúng cách xử lý chuẩn của Prisma.
 */
export async function deleteDepartmentsMany(
  ids: number[],
): Promise<{ deletedCount: number; skippedIds: number[] }> {
  const run = () =>
    prisma.$transaction(
      async (tx) => {
        const childCounts = await tx.var_phong_ban.groupBy({
          by: ['id_cha'],
          where: { id_cha: { in: ids } },
          _count: true,
        });
        const idsWithChildren = new Set(
          childCounts.map((c) => c.id_cha).filter((id): id is number => id != null),
        );
        const deletableIds = ids.filter((id) => !idsWithChildren.has(id));
        const skippedIds = ids.filter((id) => idsWithChildren.has(id));
        if (deletableIds.length === 0) return { deletedCount: 0, skippedIds };
        const result = await tx.var_phong_ban.deleteMany({ where: { id: { in: deletableIds } } });
        return { deletedCount: result.count, skippedIds };
      },
      { isolationLevel: 'Serializable' },
    );

  try {
    return await run();
  } catch (err) {
    if (isSerializationFailure(err)) return run();
    throw err;
  }
}

function isSerializationFailure(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2034'
  );
}

export async function getDepartmentNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.var_phong_ban.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}

export async function countDepartmentChildren(id: number): Promise<number> {
  return prisma.var_phong_ban.count({ where: { id_cha: id } });
}
