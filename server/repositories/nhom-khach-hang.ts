import { prisma } from '@/server/db';
import {
  mapNhomKhachHangFromDb,
  toDbId,
  type AppNhomKhachHang,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachCreatorNames } from '@/server/repositories/attach-creator-names';

export interface NhomKhachHangPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}

export interface NhomKhachHangCreateInput {
  ten_nhom: string;
  mo_ta?: string | null;
  nguoi_tao?: string | null;
}

export interface NhomKhachHangUpdateInput {
  ten_nhom?: string;
  mo_ta?: string | null;
}

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.kh_thiet_lap_nhom_khach_hangOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'ten_nhom':
      return { ten_nhom: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { id: dir };
  }
}

async function mapRowsWithCreator(
  rows: Awaited<ReturnType<typeof prisma.kh_thiet_lap_nhom_khach_hang.findMany>>,
): Promise<AppNhomKhachHang[]> {
  const enriched = await attachCreatorNames(rows);
  return enriched.map(mapNhomKhachHangFromDb);
}

export async function findNhomKhachHangById(id: number): Promise<AppNhomKhachHang | null> {
  const row = await prisma.kh_thiet_lap_nhom_khach_hang.findUnique({ where: { id } });
  if (!row) return null;
  const [item] = await mapRowsWithCreator([row]);
  return item ?? null;
}

export async function findNhomKhachHangPage(
  query: NhomKhachHangPageQuery = {},
): Promise<{ items: AppNhomKhachHang[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const search = query.search?.trim();

  const where: Prisma.kh_thiet_lap_nhom_khach_hangWhereInput = search
    ? {
        OR: [
          { ten_nhom: { contains: search, mode: 'insensitive' } },
          { mo_ta: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.kh_thiet_lap_nhom_khach_hang.count({ where }),
    prisma.kh_thiet_lap_nhom_khach_hang.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
    }),
  ]);

  return { items: await mapRowsWithCreator(rows), total };
}

export async function createNhomKhachHang(
  input: NhomKhachHangCreateInput,
): Promise<AppNhomKhachHang> {
  const now = new Date();
  const inserted = await prisma.kh_thiet_lap_nhom_khach_hang.create({
    data: {
      ten_nhom: input.ten_nhom,
      mo_ta: input.mo_ta ?? null,
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findNhomKhachHangById(inserted.id);
  if (!item) throw new Error('Failed to load created customer group');
  return item;
}

export async function updateNhomKhachHang(
  id: number,
  input: NhomKhachHangUpdateInput,
): Promise<AppNhomKhachHang | null> {
  const existing = await prisma.kh_thiet_lap_nhom_khach_hang.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.kh_thiet_lap_nhom_khach_hang.update({
    where: { id },
    data: {
      ...(input.ten_nhom != null ? { ten_nhom: input.ten_nhom } : {}),
      ...(input.mo_ta !== undefined ? { mo_ta: input.mo_ta } : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findNhomKhachHangById(id);
}

export async function deleteNhomKhachHang(id: number): Promise<boolean> {
  try {
    await prisma.kh_thiet_lap_nhom_khach_hang.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getNhomKhachHangNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.kh_thiet_lap_nhom_khach_hang.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}
