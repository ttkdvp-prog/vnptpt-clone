import { prisma } from '@/server/db';
import {
  mapLoaiTaiLieuFromDb,
  toDbId,
  type AppLoaiTaiLieu,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachCreatorNames } from '@/server/repositories/attach-creator-names';

export interface LoaiTaiLieuPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}

export interface LoaiTaiLieuCreateInput {
  thu_tu: number;
  ten_loai_tai_lieu: string;
  mo_ta?: string | null;
  nguoi_tao?: string | null;
}

export interface LoaiTaiLieuUpdateInput {
  thu_tu?: number;
  ten_loai_tai_lieu?: string;
  mo_ta?: string | null;
}

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.tai_lieu_thiet_lap_loai_tai_lieuOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'thu_tu':
      return { thu_tu: dir };
    case 'ten_loai_tai_lieu':
      return { ten_loai_tai_lieu: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { thu_tu: 'asc' };
  }
}

async function mapRowsWithCreator(
  rows: Awaited<ReturnType<typeof prisma.tai_lieu_thiet_lap_loai_tai_lieu.findMany>>,
): Promise<AppLoaiTaiLieu[]> {
  const enriched = await attachCreatorNames(rows);
  return enriched.map(mapLoaiTaiLieuFromDb);
}

export async function findLoaiTaiLieuById(id: number): Promise<AppLoaiTaiLieu | null> {
  const row = await prisma.tai_lieu_thiet_lap_loai_tai_lieu.findUnique({ where: { id } });
  if (!row) return null;
  const [item] = await mapRowsWithCreator([row]);
  return item ?? null;
}

export async function findLoaiTaiLieuPage(
  query: LoaiTaiLieuPageQuery = {},
): Promise<{ items: AppLoaiTaiLieu[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const search = query.search?.trim();

  const where: Prisma.tai_lieu_thiet_lap_loai_tai_lieuWhereInput = search
    ? {
        OR: [
          { ten_loai_tai_lieu: { contains: search, mode: 'insensitive' } },
          { mo_ta: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.tai_lieu_thiet_lap_loai_tai_lieu.count({ where }),
    prisma.tai_lieu_thiet_lap_loai_tai_lieu.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
    }),
  ]);

  return { items: await mapRowsWithCreator(rows), total };
}

export async function createLoaiTaiLieu(
  input: LoaiTaiLieuCreateInput,
): Promise<AppLoaiTaiLieu> {
  const now = new Date();
  const inserted = await prisma.tai_lieu_thiet_lap_loai_tai_lieu.create({
    data: {
      thu_tu: input.thu_tu,
      ten_loai_tai_lieu: input.ten_loai_tai_lieu,
      mo_ta: input.mo_ta ?? null,
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findLoaiTaiLieuById(inserted.id);
  if (!item) throw new Error('Failed to load created document type');
  return item;
}

export async function updateLoaiTaiLieu(
  id: number,
  input: LoaiTaiLieuUpdateInput,
): Promise<AppLoaiTaiLieu | null> {
  const existing = await prisma.tai_lieu_thiet_lap_loai_tai_lieu.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.tai_lieu_thiet_lap_loai_tai_lieu.update({
    where: { id },
    data: {
      ...(input.thu_tu != null ? { thu_tu: input.thu_tu } : {}),
      ...(input.ten_loai_tai_lieu != null ? { ten_loai_tai_lieu: input.ten_loai_tai_lieu } : {}),
      ...(input.mo_ta !== undefined ? { mo_ta: input.mo_ta } : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findLoaiTaiLieuById(id);
}

export async function deleteLoaiTaiLieu(id: number): Promise<boolean> {
  try {
    await prisma.tai_lieu_thiet_lap_loai_tai_lieu.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getLoaiTaiLieuNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.tai_lieu_thiet_lap_loai_tai_lieu.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}
