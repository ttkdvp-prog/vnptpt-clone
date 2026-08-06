import { assertPrismaModel, prisma } from '@/server/db';
import {
  mapThongBaoFromDb,
  toDbId,
  type AppThongBao,
  type DbThongBao,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachCreatorNames } from '@/server/repositories/attach-creator-names';
import type { ThongBaoViewer } from '@/server/permissions/thong-bao';

type PrismaThongBaoRow = Prisma.hc_thong_baoGetPayload<object>;

export interface ThongBaoPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  viewer?: ThongBaoViewer;
}

export interface ThongBaoCreateInput {
  tg_dang: string;
  tieu_de: string;
  noi_dung: string;
  id_chuc_vu?: string[];
  nguoi_tao?: string | null;
}

export type ThongBaoUpdateInput = Partial<Omit<ThongBaoCreateInput, 'nguoi_tao'>>;

function toDbIdArray(values: string[] | undefined | null): number[] {
  if (!values?.length) return [];
  return values.map((v) => Number(v)).filter((n) => Number.isFinite(n));
}

function buildVisibilityWhere(
  viewer: ThongBaoViewer | undefined,
): Prisma.hc_thong_baoWhereInput | undefined {
  if (!viewer || viewer.bypassAcl) return undefined;

  const or: Prisma.hc_thong_baoWhereInput[] = [{ id_chuc_vu: { isEmpty: true } }];
  if (viewer.employeeId != null) {
    or.push({ nguoi_tao: viewer.employeeId });
  }
  if (viewer.chucVuId != null) {
    or.push({ id_chuc_vu: { has: viewer.chucVuId } });
  }
  return { OR: or };
}

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.hc_thong_baoOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'tg_dang':
      return { tg_dang: dir };
    case 'tieu_de':
      return { tieu_de: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { tg_dang: 'desc' };
  }
}

function buildWhere(query: ThongBaoPageQuery): Prisma.hc_thong_baoWhereInput {
  const parts: Prisma.hc_thong_baoWhereInput[] = [];
  const visibility = buildVisibilityWhere(query.viewer);
  if (visibility) parts.push(visibility);

  const search = query.search?.trim();
  if (search) {
    parts.push({
      OR: [
        { tieu_de: { contains: search, mode: 'insensitive' } },
        { noi_dung: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

async function enrichPositionNames(items: AppThongBao[]): Promise<AppThongBao[]> {
  const positionIds = [
    ...new Set(items.flatMap((item) => item.id_chuc_vu.map(Number).filter(Number.isFinite))),
  ];
  if (!positionIds.length) {
    return items.map((item) => ({ ...item, ten_chuc_vu: [] }));
  }

  const positions = await prisma.var_chuc_vu.findMany({
    where: { id: { in: positionIds } },
    select: { id: true, ten_chuc_vu: true },
  });
  const posName = new Map(positions.map((p) => [String(p.id), p.ten_chuc_vu]));

  return items.map((item) => ({
    ...item,
    ten_chuc_vu: item.id_chuc_vu.map((id) => posName.get(id) ?? id),
  }));
}

async function mapRows(rows: PrismaThongBaoRow[]): Promise<AppThongBao[]> {
  const withCreators = await attachCreatorNames(
    rows as (DbThongBao & { nguoi_tao?: number | null })[],
  );
  const mapped = withCreators.map((row) => mapThongBaoFromDb(row as DbThongBao));
  return enrichPositionNames(mapped);
}

export function canViewerAccessThongBao(
  item: { nguoi_tao?: string | null; id_chuc_vu: string[] },
  viewer: ThongBaoViewer,
): boolean {
  if (viewer.bypassAcl) return true;
  if (item.id_chuc_vu.length === 0) return true;
  if (
    viewer.employeeId != null &&
    item.nguoi_tao != null &&
    String(viewer.employeeId) === item.nguoi_tao
  ) {
    return true;
  }
  if (viewer.chucVuId != null && item.id_chuc_vu.includes(String(viewer.chucVuId))) {
    return true;
  }
  return false;
}

export async function findThongBaoById(id: number): Promise<AppThongBao | null> {
  assertPrismaModel(prisma.hc_thong_bao, 'hc_thong_bao');
  const row = await prisma.hc_thong_bao.findUnique({ where: { id } });
  if (!row) return null;
  const [item] = await mapRows([row]);
  return item ?? null;
}

export async function findThongBaoPage(
  query: ThongBaoPageQuery = {},
): Promise<{ items: AppThongBao[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? false;
  const where = buildWhere(query);

  assertPrismaModel(prisma.hc_thong_bao, 'hc_thong_bao');

  const [total, rows] = await Promise.all([
    prisma.hc_thong_bao.count({ where }),
    prisma.hc_thong_bao.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
    }),
  ]);

  return { items: await mapRows(rows), total };
}

function parseDateTime(value: string | null | undefined): Date | null {
  if (value == null || value.trim() === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createThongBao(input: ThongBaoCreateInput): Promise<AppThongBao> {
  assertPrismaModel(prisma.hc_thong_bao, 'hc_thong_bao');
  const now = new Date();
  const tgDang = parseDateTime(input.tg_dang) ?? now;

  const row = await prisma.hc_thong_bao.create({
    data: {
      tg_dang: tgDang,
      tieu_de: input.tieu_de.trim(),
      noi_dung: input.noi_dung.trim(),
      id_chuc_vu: toDbIdArray(input.id_chuc_vu),
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });

  const [item] = await mapRows([row]);
  if (!item) throw new Error('Failed to map created thong bao');
  return item;
}

export async function updateThongBao(
  id: number,
  input: ThongBaoUpdateInput,
): Promise<AppThongBao | null> {
  assertPrismaModel(prisma.hc_thong_bao, 'hc_thong_bao');
  const data: Prisma.hc_thong_baoUncheckedUpdateInput = {
    tg_cap_nhat: new Date(),
  };

  if (input.tg_dang != null) {
    const d = parseDateTime(input.tg_dang);
    if (d) data.tg_dang = d;
  }
  if (input.tieu_de != null) data.tieu_de = input.tieu_de.trim();
  if (input.noi_dung != null) data.noi_dung = input.noi_dung.trim();
  if (input.id_chuc_vu !== undefined) {
    data.id_chuc_vu = toDbIdArray(input.id_chuc_vu);
  }

  try {
    const row = await prisma.hc_thong_bao.update({ where: { id }, data });
    const [item] = await mapRows([row]);
    return item ?? null;
  } catch {
    return null;
  }
}

export async function deleteThongBao(id: number): Promise<boolean> {
  assertPrismaModel(prisma.hc_thong_bao, 'hc_thong_bao');
  try {
    await prisma.hc_thong_bao.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
