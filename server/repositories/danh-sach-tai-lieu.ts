import { prisma } from '@/server/db';
import {
  mapDanhSachTaiLieuFromDb,
  toDbId,
  type AppDanhSachTaiLieu,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachCreatorNames } from '@/server/repositories/attach-creator-names';
import type { DocumentListViewer } from '@/server/permissions/danh-sach-tai-lieu';

const documentInclude = {
  loai: { select: { ten_loai_tai_lieu: true } },
} as const;

type PrismaDocumentRow = Prisma.tai_lieu_danh_sach_tai_lieuGetPayload<{
  include: typeof documentInclude;
}>;

export interface DanhSachTaiLieuPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  viewer?: DocumentListViewer;
  id_loai_tai_lieu?: string[];
  trang_thai?: string[];
  nguoi_tao?: string[];
  /** Inclusive range on tg_tao */
  from?: string | Date;
  to?: string | Date;
}

export interface DocumentStatsAggregatesResult {
  kpis: {
    total: number;
    du_thao: number;
    hieu_luc: number;
    loi_thoi: number;
    cho_sua: number;
    typeCount: number;
    createdThisMonth: number;
    createdPrevMonth: number;
  };
  byType: Array<{ id: string; name: string; count: number }>;
  byStatus: Array<{ key: string; count: number }>;
  byCreator: Array<{ id: string | null; name: string; count: number }>;
  createdByMonth: Array<{ month: string; count: number }>;
  typeSummary: Array<{
    id: string;
    name: string;
    total: number;
    du_thao: number;
    hieu_luc: number;
    loi_thoi: number;
    cho_sua: number;
  }>;
}

export interface DanhSachTaiLieuCreateInput {
  id_loai_tai_lieu: string;
  ten_tai_lieu: string;
  mo_ta?: string | null;
  link_tai_lieu?: string | null;
  ghi_chu?: string | null;
  trang_thai: string;
  id_chuc_vu?: string[];
  id_nhan_vien?: string[];
  nguoi_tao?: string | null;
}

export interface DanhSachTaiLieuUpdateInput {
  id_loai_tai_lieu?: string;
  ten_tai_lieu?: string;
  mo_ta?: string | null;
  link_tai_lieu?: string | null;
  ghi_chu?: string | null;
  trang_thai?: string;
  id_chuc_vu?: string[];
  id_nhan_vien?: string[];
}

function toDbIdArray(values: string[] | undefined | null): number[] {
  if (!values?.length) return [];
  return values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
}

function buildVisibilityWhere(
  viewer: DocumentListViewer | undefined,
): Prisma.tai_lieu_danh_sach_tai_lieuWhereInput | undefined {
  if (!viewer || viewer.bypassAcl) return undefined;

  const or: Prisma.tai_lieu_danh_sach_tai_lieuWhereInput[] = [
    {
      AND: [{ id_chuc_vu: { isEmpty: true } }, { id_nhan_vien: { isEmpty: true } }],
    },
  ];
  if (viewer.employeeId != null) {
    or.push({ nguoi_tao: viewer.employeeId });
    or.push({ id_nhan_vien: { has: viewer.employeeId } });
  }
  if (viewer.chucVuId != null) {
    or.push({ id_chuc_vu: { has: viewer.chucVuId } });
  }
  return { OR: or };
}

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.tai_lieu_danh_sach_tai_lieuOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'ten_tai_lieu':
      return { ten_tai_lieu: dir };
    case 'trang_thai':
      return { trang_thai: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    case 'id_loai_tai_lieu':
      return { id_loai_tai_lieu: dir };
    default:
      return { tg_cap_nhat: 'desc' };
  }
}

async function enrichAclNames(
  items: AppDanhSachTaiLieu[],
): Promise<AppDanhSachTaiLieu[]> {
  const positionIds = [
    ...new Set(items.flatMap((item) => item.id_chuc_vu.map(Number).filter(Number.isFinite))),
  ];
  const employeeIds = [
    ...new Set(items.flatMap((item) => item.id_nhan_vien.map(Number).filter(Number.isFinite))),
  ];

  const [positions, employees] = await Promise.all([
    positionIds.length
      ? prisma.var_chuc_vu.findMany({
          where: { id: { in: positionIds } },
          select: { id: true, ten_chuc_vu: true },
        })
      : Promise.resolve([]),
    employeeIds.length
      ? prisma.var_nhan_vien.findMany({
          where: { id: { in: employeeIds } },
          select: { id: true, ho_va_ten: true },
        })
      : Promise.resolve([]),
  ]);

  const posName = new Map(positions.map((p) => [String(p.id), p.ten_chuc_vu]));
  const empName = new Map(employees.map((e) => [String(e.id), e.ho_va_ten]));

  return items.map((item) => ({
    ...item,
    ten_chuc_vu: item.id_chuc_vu.map((id) => posName.get(id) ?? id),
    ten_nhan_vien: item.id_nhan_vien.map((id) => empName.get(id) ?? id),
  }));
}

async function mapRows(rows: PrismaDocumentRow[]): Promise<AppDanhSachTaiLieu[]> {
  const withCreators = await attachCreatorNames(rows);
  const mapped = withCreators.map((row) =>
    mapDanhSachTaiLieuFromDb({
      ...row,
      ten_loai_tai_lieu: row.loai?.ten_loai_tai_lieu ?? null,
    }),
  );
  return enrichAclNames(mapped);
}

export function canViewerAccessDocument(
  item: { nguoi_tao?: string | null; id_chuc_vu: string[]; id_nhan_vien: string[] },
  viewer: DocumentListViewer,
): boolean {
  if (viewer.bypassAcl) return true;
  if (
    item.id_chuc_vu.length === 0 &&
    item.id_nhan_vien.length === 0
  ) {
    return true;
  }
  if (
    viewer.employeeId != null &&
    item.nguoi_tao != null &&
    String(viewer.employeeId) === item.nguoi_tao
  ) {
    return true;
  }
  if (
    viewer.employeeId != null &&
    item.id_nhan_vien.includes(String(viewer.employeeId))
  ) {
    return true;
  }
  if (
    viewer.chucVuId != null &&
    item.id_chuc_vu.includes(String(viewer.chucVuId))
  ) {
    return true;
  }
  return false;
}

export async function findDanhSachTaiLieuById(
  id: number,
): Promise<AppDanhSachTaiLieu | null> {
  const row = await prisma.tai_lieu_danh_sach_tai_lieu.findUnique({
    where: { id },
    include: documentInclude,
  });
  if (!row) return null;
  const [item] = await mapRows([row]);
  return item ?? null;
}

function parseDateBound(value: string | Date | undefined, endOfDay: boolean): Date | undefined {
  if (value == null || value === '') return undefined;
  const d = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function buildDocumentStatsWhere(
  query: Pick<
    DanhSachTaiLieuPageQuery,
    'viewer' | 'search' | 'id_loai_tai_lieu' | 'trang_thai' | 'nguoi_tao' | 'from' | 'to'
  >,
): Prisma.tai_lieu_danh_sach_tai_lieuWhereInput {
  const parts: Prisma.tai_lieu_danh_sach_tai_lieuWhereInput[] = [];
  const visibility = buildVisibilityWhere(query.viewer);
  if (visibility) parts.push(visibility);

  const search = query.search?.trim();
  if (search) {
    parts.push({
      OR: [
        { ten_tai_lieu: { contains: search, mode: 'insensitive' } },
        { mo_ta: { contains: search, mode: 'insensitive' } },
        { ghi_chu: { contains: search, mode: 'insensitive' } },
        { link_tai_lieu: { contains: search, mode: 'insensitive' } },
        { loai: { ten_loai_tai_lieu: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  if (query.id_loai_tai_lieu?.length) {
    const ids = query.id_loai_tai_lieu.map(Number).filter(Number.isFinite);
    if (ids.length) parts.push({ id_loai_tai_lieu: { in: ids } });
  }
  if (query.trang_thai?.length) {
    parts.push({ trang_thai: { in: query.trang_thai } });
  }
  if (query.nguoi_tao?.length) {
    const ids = query.nguoi_tao.map(Number).filter(Number.isFinite);
    if (ids.length) parts.push({ nguoi_tao: { in: ids } });
  }

  const from = parseDateBound(query.from, false);
  const to = parseDateBound(query.to, true);
  if (from || to) {
    parts.push({
      tg_tao: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthKeysEndingAt(end: Date, count: number): string[] {
  const keys: string[] = [];
  const cursor = new Date(end.getFullYear(), end.getMonth(), 1);
  for (let i = 0; i < count; i++) {
    keys.unshift(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return keys;
}

export async function findDanhSachTaiLieuPage(
  query: DanhSachTaiLieuPageQuery = {},
): Promise<{ items: AppDanhSachTaiLieu[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? false;

  const where = buildDocumentStatsWhere(query);

  const [total, rows] = await Promise.all([
    prisma.tai_lieu_danh_sach_tai_lieu.count({ where }),
    prisma.tai_lieu_danh_sach_tai_lieu.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
      include: documentInclude,
    }),
  ]);

  return { items: await mapRows(rows), total };
}

export async function getDocumentStatsAggregates(
  query: Pick<
    DanhSachTaiLieuPageQuery,
    'viewer' | 'id_loai_tai_lieu' | 'trang_thai' | 'nguoi_tao' | 'from' | 'to'
  > = {},
): Promise<DocumentStatsAggregatesResult> {
  const where = buildDocumentStatsWhere(query);
  const end = parseDateBound(query.to, true) ?? new Date();
  const prev = new Date(end.getFullYear(), end.getMonth() - 1, 1);
  const months = monthKeysEndingAt(end, 12);

  const [
    total,
    du_thao,
    hieu_luc,
    loi_thoi,
    cho_sua,
    createdThisMonth,
    createdPrevMonth,
    byTypeRaw,
    byStatusRaw,
    byCreatorRaw,
    createdRows,
    typeDetailRows,
  ] = await Promise.all([
    prisma.tai_lieu_danh_sach_tai_lieu.count({ where }),
    prisma.tai_lieu_danh_sach_tai_lieu.count({
      where: { AND: [where, { trang_thai: 'du_thao' }] },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.count({
      where: { AND: [where, { trang_thai: 'hieu_luc' }] },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.count({
      where: { AND: [where, { trang_thai: 'loi_thoi' }] },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.count({
      where: { AND: [where, { trang_thai: 'cho_sua' }] },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.count({
      where: {
        AND: [
          where,
          {
            tg_tao: {
              gte: new Date(end.getFullYear(), end.getMonth(), 1),
              lte: new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999),
            },
          },
        ],
      },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.count({
      where: {
        AND: [
          where,
          {
            tg_tao: {
              gte: new Date(prev.getFullYear(), prev.getMonth(), 1),
              lte: new Date(prev.getFullYear(), prev.getMonth() + 1, 0, 23, 59, 59, 999),
            },
          },
        ],
      },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.groupBy({
      by: ['id_loai_tai_lieu'],
      where,
      _count: { _all: true },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.groupBy({
      by: ['trang_thai'],
      where,
      _count: { _all: true },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.groupBy({
      by: ['nguoi_tao'],
      where,
      _count: { _all: true },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.findMany({
      where: {
        AND: [
          where,
          {
            tg_tao: {
              gte: new Date(Number(months[0]!.slice(0, 4)), Number(months[0]!.slice(5, 7)) - 1, 1),
              lte: new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999),
            },
          },
        ],
      },
      select: { tg_tao: true },
    }),
    prisma.tai_lieu_danh_sach_tai_lieu.findMany({
      where,
      select: {
        id_loai_tai_lieu: true,
        trang_thai: true,
        loai: { select: { ten_loai_tai_lieu: true } },
      },
    }),
  ]);

  const typeIds = byTypeRaw.map((r) => r.id_loai_tai_lieu);
  const typeNames =
    typeIds.length > 0
      ? await prisma.tai_lieu_thiet_lap_loai_tai_lieu.findMany({
          where: { id: { in: typeIds } },
          select: { id: true, ten_loai_tai_lieu: true },
        })
      : [];
  const typeNameMap = new Map(typeNames.map((t) => [t.id, t.ten_loai_tai_lieu]));

  const byType = byTypeRaw
    .map((r) => ({
      id: String(r.id_loai_tai_lieu),
      name: typeNameMap.get(r.id_loai_tai_lieu) ?? `Loại #${r.id_loai_tai_lieu}`,
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const byStatus = byStatusRaw.map((r) => ({
    key: r.trang_thai,
    count: r._count._all,
  }));

  const creatorIds = byCreatorRaw
    .map((r) => r.nguoi_tao)
    .filter((id): id is number => id != null);
  const creators =
    creatorIds.length > 0
      ? await prisma.var_nhan_vien.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, ho_va_ten: true },
        })
      : [];
  const creatorNameMap = new Map(creators.map((e) => [e.id, e.ho_va_ten]));

  const byCreator = byCreatorRaw
    .map((r) => ({
      id: r.nguoi_tao == null ? null : String(r.nguoi_tao),
      name:
        r.nguoi_tao == null
          ? 'Không xác định'
          : (creatorNameMap.get(r.nguoi_tao) ?? `NV #${r.nguoi_tao}`),
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const createdCountByMonth: Record<string, number> = {};
  for (const m of months) createdCountByMonth[m] = 0;
  for (const row of createdRows) {
    const k = monthKey(row.tg_tao);
    if (k in createdCountByMonth) {
      createdCountByMonth[k] = (createdCountByMonth[k] ?? 0) + 1;
    }
  }
  const createdByMonth = months.map((month) => ({
    month,
    count: createdCountByMonth[month] ?? 0,
  }));

  const typeSummaryMap = new Map<
    string,
    {
      id: string;
      name: string;
      total: number;
      du_thao: number;
      hieu_luc: number;
      loi_thoi: number;
      cho_sua: number;
    }
  >();
  for (const row of typeDetailRows) {
    const id = String(row.id_loai_tai_lieu);
    const name = row.loai?.ten_loai_tai_lieu ?? typeNameMap.get(row.id_loai_tai_lieu) ?? id;
    let bucket = typeSummaryMap.get(id);
    if (!bucket) {
      bucket = {
        id,
        name,
        total: 0,
        du_thao: 0,
        hieu_luc: 0,
        loi_thoi: 0,
        cho_sua: 0,
      };
      typeSummaryMap.set(id, bucket);
    }
    bucket.total++;
    if (row.trang_thai === 'du_thao') bucket.du_thao++;
    else if (row.trang_thai === 'hieu_luc') bucket.hieu_luc++;
    else if (row.trang_thai === 'loi_thoi') bucket.loi_thoi++;
    else if (row.trang_thai === 'cho_sua') bucket.cho_sua++;
  }
  const typeSummary = [...typeSummaryMap.values()].sort((a, b) => b.total - a.total);

  return {
    kpis: {
      total,
      du_thao,
      hieu_luc,
      loi_thoi,
      cho_sua,
      typeCount: byType.length,
      createdThisMonth,
      createdPrevMonth,
    },
    byType,
    byStatus,
    byCreator,
    createdByMonth,
    typeSummary,
  };
}

export async function createDanhSachTaiLieu(
  input: DanhSachTaiLieuCreateInput,
): Promise<AppDanhSachTaiLieu> {
  const idLoai = toDbId(input.id_loai_tai_lieu);
  if (idLoai == null) throw new Error('id_loai_tai_lieu là bắt buộc');

  const now = new Date();
  const inserted = await prisma.tai_lieu_danh_sach_tai_lieu.create({
    data: {
      id_loai_tai_lieu: idLoai,
      ten_tai_lieu: input.ten_tai_lieu,
      mo_ta: input.mo_ta ?? null,
      link_tai_lieu: input.link_tai_lieu ?? null,
      ghi_chu: input.ghi_chu ?? null,
      trang_thai: input.trang_thai,
      id_chuc_vu: toDbIdArray(input.id_chuc_vu),
      id_nhan_vien: toDbIdArray(input.id_nhan_vien),
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findDanhSachTaiLieuById(inserted.id);
  if (!item) throw new Error('Failed to load created document');
  return item;
}

export async function updateDanhSachTaiLieu(
  id: number,
  input: DanhSachTaiLieuUpdateInput,
): Promise<AppDanhSachTaiLieu | null> {
  const existing = await prisma.tai_lieu_danh_sach_tai_lieu.findUnique({ where: { id } });
  if (!existing) return null;

  const idLoai =
    input.id_loai_tai_lieu != null ? toDbId(input.id_loai_tai_lieu) : undefined;

  await prisma.tai_lieu_danh_sach_tai_lieu.update({
    where: { id },
    data: {
      ...(idLoai != null ? { id_loai_tai_lieu: idLoai } : {}),
      ...(input.ten_tai_lieu != null ? { ten_tai_lieu: input.ten_tai_lieu } : {}),
      ...(input.mo_ta !== undefined ? { mo_ta: input.mo_ta } : {}),
      ...(input.link_tai_lieu !== undefined ? { link_tai_lieu: input.link_tai_lieu } : {}),
      ...(input.ghi_chu !== undefined ? { ghi_chu: input.ghi_chu } : {}),
      ...(input.trang_thai != null ? { trang_thai: input.trang_thai } : {}),
      ...(input.id_chuc_vu !== undefined
        ? { id_chuc_vu: toDbIdArray(input.id_chuc_vu) }
        : {}),
      ...(input.id_nhan_vien !== undefined
        ? { id_nhan_vien: toDbIdArray(input.id_nhan_vien) }
        : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findDanhSachTaiLieuById(id);
}

export async function deleteDanhSachTaiLieu(id: number): Promise<boolean> {
  try {
    await prisma.tai_lieu_danh_sach_tai_lieu.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getDanhSachTaiLieuNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.tai_lieu_danh_sach_tai_lieu.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}
