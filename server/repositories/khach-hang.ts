import { assertPrismaModel, prisma } from '@/server/db';
import {
  mapKhachHangFromDb,
  toDbId,
  type AppKhachHang,
  type DbKhachHang,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachCreatorNames } from '@/server/repositories/attach-creator-names';

const khachHangInclude = {
  nhom: { select: { ten_nhom: true } },
  trang_thai: { select: { ten_trang_thai: true } },
  _count: { select: { nguoi_lien_he: true } },
} as const;

type PrismaKhachHangRow = Prisma.kh_danh_sach_khach_hangGetPayload<{
  include: typeof khachHangInclude;
}>;

export interface KhachHangPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}

export interface KhachHangCreateInput {
  ma_khach_hang: string;
  ten_khach_hang: string;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
  ghi_chu?: string | null;
  id_nhom: string;
  id_trang_thai: string;
  nguoi_tao?: string | null;
}

export interface KhachHangUpdateInput {
  ma_khach_hang?: string;
  ten_khach_hang?: string;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
  ghi_chu?: string | null;
  id_nhom?: string;
  id_trang_thai?: string;
}

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.kh_danh_sach_khach_hangOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'ma_khach_hang':
      return { ma_khach_hang: dir };
    case 'ten_khach_hang':
      return { ten_khach_hang: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { id: dir };
  }
}

function toDbRow(row: PrismaKhachHangRow): DbKhachHang {
  return {
    id: row.id,
    ma_khach_hang: row.ma_khach_hang,
    ten_khach_hang: row.ten_khach_hang,
    so_dien_thoai: row.so_dien_thoai,
    dia_chi: row.dia_chi,
    ghi_chu: row.ghi_chu,
    id_nhom: row.id_nhom,
    id_trang_thai: row.id_trang_thai,
    nguoi_tao: row.nguoi_tao,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    ten_nhom: row.nhom?.ten_nhom ?? null,
    ten_trang_thai: row.trang_thai?.ten_trang_thai ?? null,
    so_nguoi_lien_he: row._count.nguoi_lien_he,
  };
}

async function mapRowsWithCreator(rows: PrismaKhachHangRow[]): Promise<AppKhachHang[]> {
  const enriched = await attachCreatorNames(rows.map(toDbRow) as (DbKhachHang & {
    nguoi_tao?: number | null;
  })[]);
  return enriched.map(mapKhachHangFromDb);
}

export async function findKhachHangById(id: number): Promise<AppKhachHang | null> {
  const row = await prisma.kh_danh_sach_khach_hang.findUnique({
    where: { id },
    include: khachHangInclude,
  });
  if (!row) return null;
  const [item] = await mapRowsWithCreator([row]);
  return item ?? null;
}

export async function findKhachHangPage(
  query: KhachHangPageQuery = {},
): Promise<{ items: AppKhachHang[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const search = query.search?.trim();

  const where: Prisma.kh_danh_sach_khach_hangWhereInput = search
    ? {
        OR: [
          { ma_khach_hang: { contains: search, mode: 'insensitive' } },
          { ten_khach_hang: { contains: search, mode: 'insensitive' } },
          { so_dien_thoai: { contains: search, mode: 'insensitive' } },
          { dia_chi: { contains: search, mode: 'insensitive' } },
          { ghi_chu: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  assertPrismaModel(prisma.kh_danh_sach_khach_hang, 'kh_danh_sach_khach_hang');

  const [total, rows] = await Promise.all([
    prisma.kh_danh_sach_khach_hang.count({ where }),
    prisma.kh_danh_sach_khach_hang.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
      include: khachHangInclude,
    }),
  ]);

  return { items: await mapRowsWithCreator(rows), total };
}

const MA_PREFIX = 'KH';
const MA_PAD = 4;

/** Gợi ý mã tăng dần dạng KH0001 dựa trên mã lớn nhất hiện có. */
export async function getNextMaKhachHang(): Promise<string> {
  const rows = await prisma.kh_danh_sach_khach_hang.findMany({
    where: { ma_khach_hang: { startsWith: MA_PREFIX } },
    select: { ma_khach_hang: true },
  });
  let max = 0;
  const re = new RegExp(`^${MA_PREFIX}(\\d+)$`);
  for (const row of rows) {
    const m = re.exec(row.ma_khach_hang);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${MA_PREFIX}${String(max + 1).padStart(MA_PAD, '0')}`;
}

export async function createKhachHang(input: KhachHangCreateInput): Promise<AppKhachHang> {
  const idNhom = toDbId(input.id_nhom);
  const idTrangThai = toDbId(input.id_trang_thai);
  if (idNhom == null) throw new Error('id_nhom là bắt buộc');
  if (idTrangThai == null) throw new Error('id_trang_thai là bắt buộc');

  const now = new Date();
  const inserted = await prisma.kh_danh_sach_khach_hang.create({
    data: {
      ma_khach_hang: input.ma_khach_hang,
      ten_khach_hang: input.ten_khach_hang,
      so_dien_thoai: input.so_dien_thoai ?? null,
      dia_chi: input.dia_chi ?? null,
      ghi_chu: input.ghi_chu ?? null,
      id_nhom: idNhom,
      id_trang_thai: idTrangThai,
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findKhachHangById(inserted.id);
  if (!item) throw new Error('Failed to load created customer');
  return item;
}

export async function updateKhachHang(
  id: number,
  input: KhachHangUpdateInput,
): Promise<AppKhachHang | null> {
  const existing = await prisma.kh_danh_sach_khach_hang.findUnique({ where: { id } });
  if (!existing) return null;

  const idNhom = input.id_nhom != null ? toDbId(input.id_nhom) : undefined;
  const idTrangThai = input.id_trang_thai != null ? toDbId(input.id_trang_thai) : undefined;

  await prisma.kh_danh_sach_khach_hang.update({
    where: { id },
    data: {
      ...(input.ma_khach_hang != null ? { ma_khach_hang: input.ma_khach_hang } : {}),
      ...(input.ten_khach_hang != null ? { ten_khach_hang: input.ten_khach_hang } : {}),
      ...(input.so_dien_thoai !== undefined ? { so_dien_thoai: input.so_dien_thoai } : {}),
      ...(input.dia_chi !== undefined ? { dia_chi: input.dia_chi } : {}),
      ...(input.ghi_chu !== undefined ? { ghi_chu: input.ghi_chu } : {}),
      ...(idNhom != null ? { id_nhom: idNhom } : {}),
      ...(idTrangThai != null ? { id_trang_thai: idTrangThai } : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findKhachHangById(id);
}

export async function deleteKhachHang(id: number): Promise<boolean> {
  try {
    await prisma.kh_danh_sach_khach_hang.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getKhachHangNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.kh_danh_sach_khach_hang.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}
