import { assertPrismaModel, prisma } from '@/server/db';
import { mapHopDongFromDb, toDbId, type AppHopDong, type DbHopDong } from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachCreatorNames } from '@/server/repositories/attach-creator-names';

const hopDongInclude = {
  nhan_vien: { select: { ho_va_ten: true } },
  chuc_vu: { select: { ten_chuc_vu: true } },
  phong_ban: { select: { ten_phong_ban: true } },
} as const;

type PrismaHopDongRow = Prisma.ns_hop_dongGetPayload<{ include: typeof hopDongInclude }>;

export interface HopDongPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  loai_hop_dong?: string[];
  trang_thai?: string[];
  id_phong_ban?: string[];
}

export interface HopDongCreateInput {
  loai_hop_dong: string;
  ma_hop_dong: string;
  ngay_ky: string;
  ngay_hieu_luc: string;
  ngay_ket_thuc?: string | null;
  id_nhan_vien: string;
  id_chuc_vu: string;
  id_phong_ban: string;
  muc_luong: string;
  hinh_thuc_tra_luong: string;
  che_do_khac?: string | null;
  noi_lam_viec?: string | null;
  thoi_gian_lam_viec?: string | null;
  luu_y_khac?: string | null;
  ghi_chu?: string | null;
  trang_thai: string;
  nguoi_tao?: string | null;
}

export type HopDongUpdateInput = Partial<Omit<HopDongCreateInput, 'nguoi_tao'>>;

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.ns_hop_dongOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'ma_hop_dong':
      return { ma_hop_dong: dir };
    case 'loai_hop_dong':
      return { loai_hop_dong: dir };
    case 'ngay_ky':
      return { ngay_ky: dir };
    case 'ngay_hieu_luc':
      return { ngay_hieu_luc: dir };
    case 'trang_thai':
      return { trang_thai: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { tg_cap_nhat: 'desc' };
  }
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (value == null || value.trim() === '') return null;
  const s = value.trim().slice(0, 10);
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIntIds(values: string[] | undefined): number[] | undefined {
  if (!values?.length) return undefined;
  const ids = values.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  return ids.length ? ids : undefined;
}

function buildWhere(query: HopDongPageQuery): Prisma.ns_hop_dongWhereInput {
  const parts: Prisma.ns_hop_dongWhereInput[] = [];

  if (query.loai_hop_dong?.length) {
    parts.push({ loai_hop_dong: { in: query.loai_hop_dong } });
  }
  if (query.trang_thai?.length) {
    parts.push({ trang_thai: { in: query.trang_thai } });
  }
  const deptIds = toIntIds(query.id_phong_ban);
  if (deptIds) parts.push({ id_phong_ban: { in: deptIds } });

  const search = query.search?.trim();
  if (search) {
    parts.push({
      OR: [
        { ma_hop_dong: { contains: search, mode: 'insensitive' } },
        { muc_luong: { contains: search, mode: 'insensitive' } },
        { noi_lam_viec: { contains: search, mode: 'insensitive' } },
        { ghi_chu: { contains: search, mode: 'insensitive' } },
        { nhan_vien: { ho_va_ten: { contains: search, mode: 'insensitive' } } },
        { phong_ban: { ten_phong_ban: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

function toDbRow(row: PrismaHopDongRow): DbHopDong {
  return {
    id: row.id,
    loai_hop_dong: row.loai_hop_dong,
    ma_hop_dong: row.ma_hop_dong,
    ngay_ky: row.ngay_ky,
    ngay_hieu_luc: row.ngay_hieu_luc,
    ngay_ket_thuc: row.ngay_ket_thuc,
    id_nhan_vien: row.id_nhan_vien,
    id_chuc_vu: row.id_chuc_vu,
    id_phong_ban: row.id_phong_ban,
    muc_luong: row.muc_luong,
    hinh_thuc_tra_luong: row.hinh_thuc_tra_luong,
    che_do_khac: row.che_do_khac,
    noi_lam_viec: row.noi_lam_viec,
    thoi_gian_lam_viec: row.thoi_gian_lam_viec,
    luu_y_khac: row.luu_y_khac,
    ghi_chu: row.ghi_chu,
    trang_thai: row.trang_thai,
    nguoi_tao: row.nguoi_tao,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    ten_nhan_vien: row.nhan_vien?.ho_va_ten ?? null,
    ten_chuc_vu: row.chuc_vu?.ten_chuc_vu ?? null,
    ten_phong_ban: row.phong_ban?.ten_phong_ban ?? null,
  };
}

async function mapRows(rows: PrismaHopDongRow[]): Promise<AppHopDong[]> {
  const withCreators = await attachCreatorNames(
    rows.map(toDbRow) as (DbHopDong & { nguoi_tao?: number | null })[],
  );
  return withCreators.map((row) => mapHopDongFromDb(row as DbHopDong));
}

export async function findHopDongById(id: number): Promise<AppHopDong | null> {
  const row = await prisma.ns_hop_dong.findUnique({
    where: { id },
    include: hopDongInclude,
  });
  if (!row) return null;
  const [item] = await mapRows([row]);
  return item ?? null;
}

export async function findHopDongPage(
  query: HopDongPageQuery = {},
): Promise<{ items: AppHopDong[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? false;

  const where = buildWhere(query);
  assertPrismaModel(prisma.ns_hop_dong, 'ns_hop_dong');

  const [total, rows] = await Promise.all([
    prisma.ns_hop_dong.count({ where }),
    prisma.ns_hop_dong.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
      include: hopDongInclude,
    }),
  ]);

  return { items: await mapRows(rows), total };
}

function buildWriteData(input: HopDongCreateInput | HopDongUpdateInput) {
  const data: Prisma.ns_hop_dongUncheckedUpdateInput = {};
  if (input.loai_hop_dong != null) data.loai_hop_dong = input.loai_hop_dong;
  if (input.ma_hop_dong != null) data.ma_hop_dong = input.ma_hop_dong;
  if (input.ngay_ky != null) {
    const d = parseDateOnly(input.ngay_ky);
    if (d) data.ngay_ky = d;
  }
  if (input.ngay_hieu_luc != null) {
    const d = parseDateOnly(input.ngay_hieu_luc);
    if (d) data.ngay_hieu_luc = d;
  }
  if (input.ngay_ket_thuc !== undefined) {
    data.ngay_ket_thuc = parseDateOnly(input.ngay_ket_thuc);
  }
  if (input.id_nhan_vien != null) {
    const v = toDbId(input.id_nhan_vien);
    if (v != null) data.id_nhan_vien = v;
  }
  if (input.id_chuc_vu != null) {
    const v = toDbId(input.id_chuc_vu);
    if (v != null) data.id_chuc_vu = v;
  }
  if (input.id_phong_ban != null) {
    const v = toDbId(input.id_phong_ban);
    if (v != null) data.id_phong_ban = v;
  }
  if (input.muc_luong != null) data.muc_luong = input.muc_luong;
  if (input.hinh_thuc_tra_luong != null) {
    data.hinh_thuc_tra_luong = input.hinh_thuc_tra_luong;
  }
  if (input.che_do_khac !== undefined) data.che_do_khac = input.che_do_khac;
  if (input.noi_lam_viec !== undefined) data.noi_lam_viec = input.noi_lam_viec;
  if (input.thoi_gian_lam_viec !== undefined) {
    data.thoi_gian_lam_viec = input.thoi_gian_lam_viec;
  }
  if (input.luu_y_khac !== undefined) data.luu_y_khac = input.luu_y_khac;
  if (input.ghi_chu !== undefined) data.ghi_chu = input.ghi_chu;
  if (input.trang_thai != null) data.trang_thai = input.trang_thai;
  return data;
}

export async function createHopDong(input: HopDongCreateInput): Promise<AppHopDong> {
  const idNv = toDbId(input.id_nhan_vien);
  const idCv = toDbId(input.id_chuc_vu);
  const idPb = toDbId(input.id_phong_ban);
  if (idNv == null) throw new Error('id_nhan_vien là bắt buộc');
  if (idCv == null) throw new Error('id_chuc_vu là bắt buộc');
  if (idPb == null) throw new Error('id_phong_ban là bắt buộc');

  const ngayKy = parseDateOnly(input.ngay_ky);
  const ngayHieuLuc = parseDateOnly(input.ngay_hieu_luc);
  if (!ngayKy) throw new Error('ngay_ky không hợp lệ');
  if (!ngayHieuLuc) throw new Error('ngay_hieu_luc không hợp lệ');

  const now = new Date();
  const inserted = await prisma.ns_hop_dong.create({
    data: {
      loai_hop_dong: input.loai_hop_dong,
      ma_hop_dong: input.ma_hop_dong,
      ngay_ky: ngayKy,
      ngay_hieu_luc: ngayHieuLuc,
      ngay_ket_thuc: parseDateOnly(input.ngay_ket_thuc),
      id_nhan_vien: idNv,
      id_chuc_vu: idCv,
      id_phong_ban: idPb,
      muc_luong: input.muc_luong,
      hinh_thuc_tra_luong: input.hinh_thuc_tra_luong,
      che_do_khac: input.che_do_khac ?? null,
      noi_lam_viec: input.noi_lam_viec ?? null,
      thoi_gian_lam_viec: input.thoi_gian_lam_viec ?? null,
      luu_y_khac: input.luu_y_khac ?? null,
      ghi_chu: input.ghi_chu ?? null,
      trang_thai: input.trang_thai,
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findHopDongById(inserted.id);
  if (!item) throw new Error('Failed to load created hợp đồng');
  return item;
}

export async function updateHopDong(
  id: number,
  input: HopDongUpdateInput,
): Promise<AppHopDong | null> {
  const existing = await prisma.ns_hop_dong.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.ns_hop_dong.update({
    where: { id },
    data: {
      ...buildWriteData(input),
      tg_cap_nhat: new Date(),
    },
  });
  return findHopDongById(id);
}

export async function deleteHopDong(id: number): Promise<boolean> {
  try {
    await prisma.ns_hop_dong.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getHopDongNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.ns_hop_dong.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}
