import { assertPrismaModel, prisma } from '@/server/db';
import {
  mapNguoiLienHeFromDb,
  toDbId,
  type AppNguoiLienHe,
  type DbNguoiLienHe,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachCreatorNames } from '@/server/repositories/attach-creator-names';

const includeKhachHang = {
  khach_hang: { select: { ten_khach_hang: true, ma_khach_hang: true } },
} as const;

type PrismaNguoiLienHeRow = Prisma.kh_nguoi_lien_heGetPayload<{
  include: typeof includeKhachHang;
}>;

export interface NguoiLienHePageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  id_khach_hang?: string;
}

export interface NguoiLienHeCreateInput {
  id_khach_hang: string;
  ho_ten: string;
  ngay_sinh?: string | null;
  chuc_vu?: string | null;
  so_dien_thoai?: string | null;
  email?: string | null;
  dia_chi?: string | null;
  ghi_chu?: string | null;
  nguoi_tao?: string | null;
}

export interface NguoiLienHeUpdateInput {
  id_khach_hang?: string;
  ho_ten?: string;
  ngay_sinh?: string | null;
  chuc_vu?: string | null;
  so_dien_thoai?: string | null;
  email?: string | null;
  dia_chi?: string | null;
  ghi_chu?: string | null;
}

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.kh_nguoi_lien_heOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'ho_ten':
      return { ho_ten: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { id: dir };
  }
}

function toDbRow(row: PrismaNguoiLienHeRow): DbNguoiLienHe {
  return {
    id: row.id,
    id_khach_hang: row.id_khach_hang,
    ho_ten: row.ho_ten,
    ngay_sinh: row.ngay_sinh,
    chuc_vu: row.chuc_vu,
    so_dien_thoai: row.so_dien_thoai,
    email: row.email,
    dia_chi: row.dia_chi,
    ghi_chu: row.ghi_chu,
    nguoi_tao: row.nguoi_tao,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    ten_khach_hang: row.khach_hang?.ten_khach_hang ?? null,
    ma_khach_hang: row.khach_hang?.ma_khach_hang ?? null,
  };
}

async function mapRowsWithCreator(rows: PrismaNguoiLienHeRow[]): Promise<AppNguoiLienHe[]> {
  const enriched = await attachCreatorNames(
    rows.map(toDbRow) as (DbNguoiLienHe & { nguoi_tao?: number | null })[],
  );
  return enriched.map(mapNguoiLienHeFromDb);
}

export async function findNguoiLienHeById(id: number): Promise<AppNguoiLienHe | null> {
  const row = await prisma.kh_nguoi_lien_he.findUnique({
    where: { id },
    include: includeKhachHang,
  });
  if (!row) return null;
  const [item] = await mapRowsWithCreator([row]);
  return item ?? null;
}

export async function findNguoiLienHePage(
  query: NguoiLienHePageQuery = {},
): Promise<{ items: AppNguoiLienHe[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const search = query.search?.trim();
  const idKhachHang = query.id_khach_hang ? toDbId(query.id_khach_hang) : null;

  const where: Prisma.kh_nguoi_lien_heWhereInput = {
    ...(idKhachHang != null ? { id_khach_hang: idKhachHang } : {}),
    ...(search
      ? {
          OR: [
            { ho_ten: { contains: search, mode: 'insensitive' } },
            { chuc_vu: { contains: search, mode: 'insensitive' } },
            { so_dien_thoai: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { dia_chi: { contains: search, mode: 'insensitive' } },
            { ghi_chu: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  assertPrismaModel(prisma.kh_nguoi_lien_he, 'kh_nguoi_lien_he');

  const [total, rows] = await Promise.all([
    prisma.kh_nguoi_lien_he.count({ where }),
    prisma.kh_nguoi_lien_he.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
      include: includeKhachHang,
    }),
  ]);

  return { items: await mapRowsWithCreator(rows), total };
}

export async function createNguoiLienHe(
  input: NguoiLienHeCreateInput,
): Promise<AppNguoiLienHe> {
  const idKhachHang = toDbId(input.id_khach_hang);
  if (idKhachHang == null) throw new Error('id_khach_hang là bắt buộc');

  const now = new Date();
  const inserted = await prisma.kh_nguoi_lien_he.create({
    data: {
      id_khach_hang: idKhachHang,
      ho_ten: input.ho_ten,
      ngay_sinh: input.ngay_sinh ?? null,
      chuc_vu: input.chuc_vu ?? null,
      so_dien_thoai: input.so_dien_thoai ?? null,
      email: input.email ?? null,
      dia_chi: input.dia_chi ?? null,
      ghi_chu: input.ghi_chu ?? null,
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findNguoiLienHeById(inserted.id);
  if (!item) throw new Error('Failed to load created contact');
  return item;
}

export async function updateNguoiLienHe(
  id: number,
  input: NguoiLienHeUpdateInput,
): Promise<AppNguoiLienHe | null> {
  const existing = await prisma.kh_nguoi_lien_he.findUnique({ where: { id } });
  if (!existing) return null;

  const idKhachHang =
    input.id_khach_hang != null ? toDbId(input.id_khach_hang) : undefined;

  await prisma.kh_nguoi_lien_he.update({
    where: { id },
    data: {
      ...(idKhachHang != null ? { id_khach_hang: idKhachHang } : {}),
      ...(input.ho_ten != null ? { ho_ten: input.ho_ten } : {}),
      ...(input.ngay_sinh !== undefined ? { ngay_sinh: input.ngay_sinh } : {}),
      ...(input.chuc_vu !== undefined ? { chuc_vu: input.chuc_vu } : {}),
      ...(input.so_dien_thoai !== undefined ? { so_dien_thoai: input.so_dien_thoai } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.dia_chi !== undefined ? { dia_chi: input.dia_chi } : {}),
      ...(input.ghi_chu !== undefined ? { ghi_chu: input.ghi_chu } : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findNguoiLienHeById(id);
}

export async function deleteNguoiLienHe(id: number): Promise<boolean> {
  try {
    await prisma.kh_nguoi_lien_he.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getNguoiLienHeNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.kh_nguoi_lien_he.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}
