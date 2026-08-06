import { assertPrismaModel, prisma } from '@/server/db';
import {
  mapMarketInFromDb,
  toDbId,
  type AppMarketIn,
  type DbMarketIn,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachEmployeeNamesByFields } from '@/server/repositories/attach-creator-names';

const marketInInclude = {
  khach_hang: { select: { ten_khach_hang: true, ma_khach_hang: true } },
} as const;

type PrismaMarketInRow = Prisma.sx_market_inGetPayload<{
  include: typeof marketInInclude;
}>;

export interface MarketInPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}

export interface MarketInCreateInput {
  thu_tu?: number;
  id_khach_hang: string;
  ma_san_pham: string;
  ma_market: string;
  mo_ta?: string | null;
  link_file?: string | null;
  id_nguoi_ve?: string | null;
  ngay_hieu_luc?: string | null;
  nguoi_tao?: string | null;
}

export interface MarketInUpdateInput {
  thu_tu?: number;
  id_khach_hang?: string;
  ma_san_pham?: string;
  ma_market?: string;
  mo_ta?: string | null;
  link_file?: string | null;
  id_nguoi_ve?: string | null;
  ngay_hieu_luc?: string | null;
}

const EMPLOYEE_NAME_FIELDS = [
  { idKey: 'nguoi_tao', nameKey: 'ten_nguoi_tao' },
  { idKey: 'id_nguoi_ve', nameKey: 'ten_nguoi_ve' },
  { idKey: 'id_nguoi_duyet', nameKey: 'ten_nguoi_duyet' },
] as const;

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.sx_market_inOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'thu_tu':
      return { thu_tu: dir };
    case 'ma_market':
      return { ma_market: dir };
    case 'ma_san_pham':
      return { ma_san_pham: dir };
    case 'trang_thai':
      return { trang_thai: dir };
    case 'ngay_hieu_luc':
      return { ngay_hieu_luc: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { thu_tu: 'asc' };
  }
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (value == null || value.trim() === '') return null;
  const s = value.trim().slice(0, 10);
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDbRow(row: PrismaMarketInRow): DbMarketIn {
  return {
    id: row.id,
    thu_tu: row.thu_tu,
    id_khach_hang: row.id_khach_hang,
    ma_san_pham: row.ma_san_pham,
    ma_market: row.ma_market,
    mo_ta: row.mo_ta,
    link_file: row.link_file,
    id_nguoi_ve: row.id_nguoi_ve,
    trang_thai: row.trang_thai,
    ngay_hieu_luc: row.ngay_hieu_luc,
    id_nguoi_duyet: row.id_nguoi_duyet,
    tg_duyet: row.tg_duyet,
    nguoi_tao: row.nguoi_tao,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    ten_khach_hang: row.khach_hang?.ten_khach_hang ?? null,
    ma_khach_hang: row.khach_hang?.ma_khach_hang ?? null,
  };
}

async function mapRowsWithNames(rows: PrismaMarketInRow[]): Promise<AppMarketIn[]> {
  const enriched = await attachEmployeeNamesByFields(
    rows.map(toDbRow) as (DbMarketIn & Record<string, unknown>)[],
    EMPLOYEE_NAME_FIELDS,
  );
  return enriched.map((row) => mapMarketInFromDb(row as DbMarketIn));
}

export async function findMarketInById(id: number): Promise<AppMarketIn | null> {
  const row = await prisma.sx_market_in.findUnique({
    where: { id },
    include: marketInInclude,
  });
  if (!row) return null;
  const [item] = await mapRowsWithNames([row]);
  return item ?? null;
}

export async function findMarketInPage(
  query: MarketInPageQuery = {},
): Promise<{ items: AppMarketIn[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const search = query.search?.trim();

  const where: Prisma.sx_market_inWhereInput = search
    ? {
        OR: [
          { ma_market: { contains: search, mode: 'insensitive' } },
          { ma_san_pham: { contains: search, mode: 'insensitive' } },
          { mo_ta: { contains: search, mode: 'insensitive' } },
          { link_file: { contains: search, mode: 'insensitive' } },
          { khach_hang: { ten_khach_hang: { contains: search, mode: 'insensitive' } } },
          { khach_hang: { ma_khach_hang: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};

  assertPrismaModel(prisma.sx_market_in, 'sx_market_in');

  const [total, rows] = await Promise.all([
    prisma.sx_market_in.count({ where }),
    prisma.sx_market_in.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
      include: marketInInclude,
    }),
  ]);

  return { items: await mapRowsWithNames(rows), total };
}

const MA_PREFIX = 'MI';
const MA_PAD = 4;

/** Gợi ý mã tăng dần dạng MI0001 dựa trên mã lớn nhất hiện có. */
export async function getNextMaMarket(): Promise<string> {
  const rows = await prisma.sx_market_in.findMany({
    where: { ma_market: { startsWith: MA_PREFIX } },
    select: { ma_market: true },
  });
  let max = 0;
  const re = new RegExp(`^${MA_PREFIX}(\\d+)$`);
  for (const row of rows) {
    const m = re.exec(row.ma_market);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${MA_PREFIX}${String(max + 1).padStart(MA_PAD, '0')}`;
}

export async function createMarketIn(input: MarketInCreateInput): Promise<AppMarketIn> {
  const idKhachHang = toDbId(input.id_khach_hang);
  if (idKhachHang == null) throw new Error('id_khach_hang là bắt buộc');

  const now = new Date();
  const inserted = await prisma.sx_market_in.create({
    data: {
      thu_tu: input.thu_tu ?? 0,
      id_khach_hang: idKhachHang,
      ma_san_pham: input.ma_san_pham,
      ma_market: input.ma_market,
      mo_ta: input.mo_ta ?? null,
      link_file: input.link_file ?? null,
      id_nguoi_ve: toDbId(input.id_nguoi_ve),
      trang_thai: 'cho_duyet',
      ngay_hieu_luc: parseDateOnly(input.ngay_hieu_luc),
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findMarketInById(inserted.id);
  if (!item) throw new Error('Failed to load created market in');
  return item;
}

export async function updateMarketIn(
  id: number,
  input: MarketInUpdateInput,
): Promise<AppMarketIn | null> {
  const existing = await prisma.sx_market_in.findUnique({ where: { id } });
  if (!existing) return null;

  const idKhachHang = input.id_khach_hang != null ? toDbId(input.id_khach_hang) : undefined;

  await prisma.sx_market_in.update({
    where: { id },
    data: {
      ...(input.thu_tu != null ? { thu_tu: input.thu_tu } : {}),
      ...(idKhachHang != null ? { id_khach_hang: idKhachHang } : {}),
      ...(input.ma_san_pham != null ? { ma_san_pham: input.ma_san_pham } : {}),
      ...(input.ma_market != null ? { ma_market: input.ma_market } : {}),
      ...(input.mo_ta !== undefined ? { mo_ta: input.mo_ta } : {}),
      ...(input.link_file !== undefined ? { link_file: input.link_file } : {}),
      ...(input.id_nguoi_ve !== undefined ? { id_nguoi_ve: toDbId(input.id_nguoi_ve) } : {}),
      ...(input.ngay_hieu_luc !== undefined
        ? { ngay_hieu_luc: parseDateOnly(input.ngay_hieu_luc) }
        : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findMarketInById(id);
}

export async function approveMarketIn(
  id: number,
  approverId: string | null | undefined,
): Promise<AppMarketIn | null> {
  const existing = await prisma.sx_market_in.findUnique({ where: { id } });
  if (!existing) return null;

  const now = new Date();
  await prisma.sx_market_in.update({
    where: { id },
    data: {
      trang_thai: 'da_duyet',
      id_nguoi_duyet: toDbId(approverId),
      tg_duyet: now,
      tg_cap_nhat: now,
    },
  });
  return findMarketInById(id);
}

export async function suspendMarketIn(id: number): Promise<AppMarketIn | null> {
  const existing = await prisma.sx_market_in.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.sx_market_in.update({
    where: { id },
    data: {
      trang_thai: 'ngung_ap_dung',
      tg_cap_nhat: new Date(),
    },
  });
  return findMarketInById(id);
}

export async function deleteMarketIn(id: number): Promise<boolean> {
  try {
    await prisma.sx_market_in.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getMarketInNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.sx_market_in.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}
