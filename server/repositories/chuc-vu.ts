import { prisma } from '@/server/db';
import {
  mapPhongBanTrangThaiToDb,
  mapPositionFromDb,
  toDbId,
  type AppPosition,
  type DbChucVu,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';

const positionInclude = {
  phong_ban: { select: { ten_phong_ban: true } },
} as const;

type PrismaPositionRow = Prisma.var_chuc_vuGetPayload<{ include: typeof positionInclude }>;

function toDbChucVu(row: PrismaPositionRow): DbChucVu {
  return {
    id: row.id,
    id_phong_ban: row.id_phong_ban,
    ma_chuc_vu: row.ma_chuc_vu,
    ten_chuc_vu: row.ten_chuc_vu,
    cap_bac: row.cap_bac,
    mo_ta: row.mo_ta,
    thu_tu: row.thu_tu,
    trang_thai: row.trang_thai,
    nguoi_tao: row.nguoi_tao,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    ten_phong_ban: row.phong_ban?.ten_phong_ban ?? null,
  };
}

export interface ChucVuPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  activeOnly?: boolean;
}

export interface ChucVuCreateInput {
  ma_chuc_vu: string;
  ten_chuc_vu: string;
  phong_ban_id?: string | null;
  cap_bac?: number;
  mo_ta?: string | null;
  thu_tu?: number;
  trang_thai?: string;
  nguoi_tao?: string | null;
}

export interface ChucVuUpdateInput {
  ma_chuc_vu?: string;
  ten_chuc_vu?: string;
  phong_ban_id?: string | null;
  cap_bac?: number;
  mo_ta?: string | null;
  thu_tu?: number;
  trang_thai?: string;
}

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.var_chuc_vuOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'ma_chuc_vu':
      return { ma_chuc_vu: dir };
    case 'ten_chuc_vu':
      return { ten_chuc_vu: dir };
    case 'cap_bac':
      return { cap_bac: dir };
    case 'thu_tu':
      return { thu_tu: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { id: dir };
  }
}

export async function findPositionById(id: number): Promise<AppPosition | null> {
  const row = await prisma.var_chuc_vu.findUnique({
    where: { id },
    include: positionInclude,
  });
  return row ? mapPositionFromDb(toDbChucVu(row)) : null;
}

export async function findPositionsPage(
  query: ChucVuPageQuery = {},
): Promise<{ items: AppPosition[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const search = query.search?.trim();

  const where: Prisma.var_chuc_vuWhereInput = {
    ...(query.activeOnly ? { trang_thai: 'active' } : {}),
    ...(search
      ? {
          OR: [
            { ma_chuc_vu: { contains: search, mode: 'insensitive' } },
            { ten_chuc_vu: { contains: search, mode: 'insensitive' } },
            { mo_ta: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.var_chuc_vu.count({ where }),
    prisma.var_chuc_vu.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
      include: positionInclude,
    }),
  ]);

  return {
    items: rows.map((row) => mapPositionFromDb(toDbChucVu(row))),
    total,
  };
}

export async function createPosition(input: ChucVuCreateInput): Promise<AppPosition> {
  const now = new Date();
  const phongBanId =
    input.phong_ban_id === undefined || input.phong_ban_id === null || input.phong_ban_id === ''
      ? null
      : toDbId(input.phong_ban_id);

  const inserted = await prisma.var_chuc_vu.create({
    data: {
      ma_chuc_vu: input.ma_chuc_vu,
      ten_chuc_vu: input.ten_chuc_vu,
      id_phong_ban: phongBanId,
      cap_bac: input.cap_bac ?? 1,
      mo_ta: input.mo_ta ?? null,
      thu_tu: input.thu_tu ?? 0,
      trang_thai: mapPhongBanTrangThaiToDb(input.trang_thai ?? 'Đang hoạt động'),
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findPositionById(inserted.id);
  if (!item) throw new Error('Failed to load created position');
  return item;
}

export async function updatePosition(
  id: number,
  input: ChucVuUpdateInput,
): Promise<AppPosition | null> {
  const existing = await prisma.var_chuc_vu.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.var_chuc_vu.update({
    where: { id },
    data: {
      ...(input.ma_chuc_vu != null ? { ma_chuc_vu: input.ma_chuc_vu } : {}),
      ...(input.ten_chuc_vu != null ? { ten_chuc_vu: input.ten_chuc_vu } : {}),
      ...(input.phong_ban_id !== undefined
        ? {
            id_phong_ban:
              input.phong_ban_id === null || input.phong_ban_id === ''
                ? null
                : toDbId(input.phong_ban_id),
          }
        : {}),
      ...(input.cap_bac != null ? { cap_bac: input.cap_bac } : {}),
      ...(input.mo_ta !== undefined ? { mo_ta: input.mo_ta } : {}),
      ...(input.thu_tu != null ? { thu_tu: input.thu_tu } : {}),
      ...(input.trang_thai != null
        ? { trang_thai: mapPhongBanTrangThaiToDb(input.trang_thai) }
        : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findPositionById(id);
}

export async function updatePositionStatus(
  ids: number[],
  trangThai: string,
): Promise<AppPosition[]> {
  const dbStatus = mapPhongBanTrangThaiToDb(trangThai);
  const now = new Date();
  await prisma.var_chuc_vu.updateMany({
    where: { id: { in: ids } },
    data: { trang_thai: dbStatus, tg_cap_nhat: now },
  });
  const rows = await prisma.var_chuc_vu.findMany({
    where: { id: { in: ids } },
    include: positionInclude,
  });
  return rows.map((row) => mapPositionFromDb(toDbChucVu(row)));
}

export async function deletePosition(id: number): Promise<boolean> {
  try {
    await prisma.var_chuc_vu.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getPositionNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.var_chuc_vu.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}

export async function positionExists(id: number): Promise<boolean> {
  const row = await prisma.var_chuc_vu.findUnique({
    where: { id },
    select: { id: true },
  });
  return row != null;
}
