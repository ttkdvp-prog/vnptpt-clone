import { prisma } from '@/server/db';
import {
  mapTrangThaiKhachHangFromDb,
  toDbId,
  type AppTrangThaiKhachHang,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachCreatorNames } from '@/server/repositories/attach-creator-names';

export interface TrangThaiKhachHangPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}

export interface TrangThaiKhachHangCreateInput {
  ten_trang_thai: string;
  mo_ta?: string | null;
  nguoi_tao?: string | null;
}

export interface TrangThaiKhachHangUpdateInput {
  ten_trang_thai?: string;
  mo_ta?: string | null;
}

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.kh_thiet_lap_trang_thaiOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'ten_trang_thai':
      return { ten_trang_thai: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { id: dir };
  }
}

async function mapRowsWithCreator(
  rows: Awaited<ReturnType<typeof prisma.kh_thiet_lap_trang_thai.findMany>>,
): Promise<AppTrangThaiKhachHang[]> {
  const enriched = await attachCreatorNames(rows);
  return enriched.map(mapTrangThaiKhachHangFromDb);
}

export async function findTrangThaiKhachHangById(
  id: number,
): Promise<AppTrangThaiKhachHang | null> {
  const row = await prisma.kh_thiet_lap_trang_thai.findUnique({ where: { id } });
  if (!row) return null;
  const [item] = await mapRowsWithCreator([row]);
  return item ?? null;
}

export async function findTrangThaiKhachHangPage(
  query: TrangThaiKhachHangPageQuery = {},
): Promise<{ items: AppTrangThaiKhachHang[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const search = query.search?.trim();

  const where: Prisma.kh_thiet_lap_trang_thaiWhereInput = search
    ? {
        OR: [
          { ten_trang_thai: { contains: search, mode: 'insensitive' } },
          { mo_ta: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.kh_thiet_lap_trang_thai.count({ where }),
    prisma.kh_thiet_lap_trang_thai.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
    }),
  ]);

  return { items: await mapRowsWithCreator(rows), total };
}

export async function createTrangThaiKhachHang(
  input: TrangThaiKhachHangCreateInput,
): Promise<AppTrangThaiKhachHang> {
  const now = new Date();
  const inserted = await prisma.kh_thiet_lap_trang_thai.create({
    data: {
      ten_trang_thai: input.ten_trang_thai,
      mo_ta: input.mo_ta ?? null,
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findTrangThaiKhachHangById(inserted.id);
  if (!item) throw new Error('Failed to load created customer status');
  return item;
}

export async function updateTrangThaiKhachHang(
  id: number,
  input: TrangThaiKhachHangUpdateInput,
): Promise<AppTrangThaiKhachHang | null> {
  const existing = await prisma.kh_thiet_lap_trang_thai.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.kh_thiet_lap_trang_thai.update({
    where: { id },
    data: {
      ...(input.ten_trang_thai != null ? { ten_trang_thai: input.ten_trang_thai } : {}),
      ...(input.mo_ta !== undefined ? { mo_ta: input.mo_ta } : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findTrangThaiKhachHangById(id);
}

export async function deleteTrangThaiKhachHang(id: number): Promise<boolean> {
  try {
    await prisma.kh_thiet_lap_trang_thai.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getTrangThaiKhachHangNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.kh_thiet_lap_trang_thai.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}
