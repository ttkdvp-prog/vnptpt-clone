import { getTenLoaiPhieu } from '@/features/hanh-chinh/phieu-hanh-chinh/core/loai-phieu';
import { computeSoNgay } from '@/features/hanh-chinh/phieu-hanh-chinh/utils/compute-so-ngay';
import { assertPrismaModel, prisma } from '@/server/db';
import {
  mapPhieuHanhChinhFromDb,
  toDbId,
  type AppPhieuHanhChinh,
  type DbPhieuHanhChinh,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import { attachEmployeeNamesByFields } from '@/server/repositories/attach-creator-names';

const phieuInclude = {
  nhan_vien: {
    select: {
      ho_va_ten: true,
      id_phong_ban: true,
      phong_ban: { select: { ten_phong_ban: true } },
    },
  },
} as const;

type PrismaPhieuRow = Prisma.cong_luong_phieu_hanh_chinhGetPayload<{
  include: typeof phieuInclude;
}>;

export interface PhieuHanhChinhPageQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  ma_phieu?: string[];
  trang_thai?: string[];
  id_phong_ban?: string[];
  id_nhan_vien?: string[];
  /** Leave-period overlap: tu_ngay <= to AND den_ngay >= from */
  from?: string;
  to?: string;
}

export interface PhieuHanhChinhStatsAggregatesResult {
  kpis: {
    total: number;
    da_duyet: number;
    cho_duyet: number;
    tu_choi: number;
    tong_ngay: number;
    typeCount: number;
    createdThisMonth: number;
    createdPrevMonth: number;
  };
  byType: Array<{ id: string; name: string; count: number }>;
  byStatus: Array<{ key: string; count: number }>;
  byDepartment: Array<{ id: string | null; name: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  typeSummary: Array<{
    id: string;
    name: string;
    total: number;
    da_duyet: number;
    cho_duyet: number;
    tu_choi: number;
    tong_ngay: number;
    avg_ngay: number;
  }>;
}

export interface PhieuHanhChinhCreateInput {
  ma_phieu: string;
  id_nhan_vien: string;
  tu_ngay: string;
  buoi_bat_dau: string;
  den_ngay: string;
  buoi_ket_thuc: string;
  gio_bat_dau?: string | null;
  gio_ket_thuc?: string | null;
  ly_do?: string | null;
  hinh_anh?: string[];
  nguoi_tao?: string | null;
}

export interface PhieuHanhChinhUpdateInput {
  ma_phieu?: string;
  id_nhan_vien?: string;
  tu_ngay?: string;
  buoi_bat_dau?: string;
  den_ngay?: string;
  buoi_ket_thuc?: string;
  gio_bat_dau?: string | null;
  gio_ket_thuc?: string | null;
  ly_do?: string | null;
  hinh_anh?: string[];
}

const EMPLOYEE_NAME_FIELDS = [
  { idKey: 'nguoi_tao', nameKey: 'ten_nguoi_tao' },
  { idKey: 'id_ql_duyet', nameKey: 'ten_ql_duyet' },
  { idKey: 'id_hcns_duyet', nameKey: 'ten_hcns_duyet' },
] as const;

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.cong_luong_phieu_hanh_chinhOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'tu_ngay':
      return { tu_ngay: dir };
    case 'den_ngay':
      return { den_ngay: dir };
    case 'trang_thai':
      return { trang_thai: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { tg_tao: 'desc' };
  }
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (value == null || value.trim() === '') return null;
  const s = value.trim().slice(0, 10);
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDateBound(value: string | Date | undefined, endOfDay: boolean): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    const d = new Date(value);
    if (endOfDay) d.setUTCHours(23, 59, 59, 999);
    else d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  const s = String(value).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  return new Date(`${s}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
}

function toIntIds(values: string[] | undefined): number[] | undefined {
  if (!values?.length) return undefined;
  const ids = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  return ids.length ? ids : undefined;
}

function buildPhieuStatsWhere(
  query: Pick<
    PhieuHanhChinhPageQuery,
    'ma_phieu' | 'trang_thai' | 'id_phong_ban' | 'id_nhan_vien' | 'from' | 'to' | 'search'
  >,
): Prisma.cong_luong_phieu_hanh_chinhWhereInput {
  const parts: Prisma.cong_luong_phieu_hanh_chinhWhereInput[] = [];

  if (query.ma_phieu?.length) {
    parts.push({ ma_phieu: { in: query.ma_phieu } });
  }

  if (query.trang_thai?.length) {
    parts.push({ trang_thai: { in: query.trang_thai } });
  }

  const nvIds = toIntIds(query.id_nhan_vien);
  if (nvIds) parts.push({ id_nhan_vien: { in: nvIds } });

  const deptIds = toIntIds(query.id_phong_ban);
  if (deptIds) {
    parts.push({ nhan_vien: { id_phong_ban: { in: deptIds } } });
  }

  const from = parseDateBound(query.from, false);
  const to = parseDateBound(query.to, true);
  if (from || to) {
    // Overlap: tu_ngay <= to AND den_ngay >= from
    if (to) parts.push({ tu_ngay: { lte: to } });
    if (from) parts.push({ den_ngay: { gte: from } });
  }

  const search = query.search?.trim();
  if (search) {
    parts.push({
      OR: [
        { ly_do: { contains: search, mode: 'insensitive' } },
        { ma_phieu: { contains: search, mode: 'insensitive' } },
        { nhan_vien: { ho_va_ten: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthKeysEndingAt(end: Date, count: number): string[] {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  for (let i = 0; i < count; i++) {
    keys.unshift(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return keys;
}

function toDbRow(row: PrismaPhieuRow): DbPhieuHanhChinh {
  return {
    id: row.id,
    ma_phieu: row.ma_phieu,
    id_nhan_vien: row.id_nhan_vien,
    tu_ngay: row.tu_ngay,
    buoi_bat_dau: row.buoi_bat_dau,
    den_ngay: row.den_ngay,
    buoi_ket_thuc: row.buoi_ket_thuc,
    gio_bat_dau: row.gio_bat_dau,
    gio_ket_thuc: row.gio_ket_thuc,
    ly_do: row.ly_do,
    hinh_anh: row.hinh_anh,
    trang_thai: row.trang_thai,
    id_ql_duyet: row.id_ql_duyet,
    tg_ql_duyet: row.tg_ql_duyet,
    ghi_chu_ql: row.ghi_chu_ql,
    id_hcns_duyet: row.id_hcns_duyet,
    tg_hcns_duyet: row.tg_hcns_duyet,
    ghi_chu_hcns: row.ghi_chu_hcns,
    ly_do_tu_choi: row.ly_do_tu_choi,
    nguoi_tao: row.nguoi_tao,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    ten_loai_phieu: getTenLoaiPhieu(row.ma_phieu),
    ten_nhan_vien: row.nhan_vien?.ho_va_ten ?? null,
    id_phong_ban: row.nhan_vien?.id_phong_ban ?? null,
    ten_phong_ban: row.nhan_vien?.phong_ban?.ten_phong_ban ?? null,
  };
}

async function mapRowsWithNames(rows: PrismaPhieuRow[]): Promise<AppPhieuHanhChinh[]> {
  const enriched = await attachEmployeeNamesByFields(
    rows.map(toDbRow) as (DbPhieuHanhChinh & Record<string, unknown>)[],
    EMPLOYEE_NAME_FIELDS,
  );
  return enriched.map((row) => mapPhieuHanhChinhFromDb(row as DbPhieuHanhChinh));
}

export async function findPhieuHanhChinhById(
  id: number,
): Promise<AppPhieuHanhChinh | null> {
  const row = await prisma.cong_luong_phieu_hanh_chinh.findUnique({
    where: { id },
    include: phieuInclude,
  });
  if (!row) return null;
  const [item] = await mapRowsWithNames([row]);
  return item ?? null;
}

export async function findPhieuHanhChinhPage(
  query: PhieuHanhChinhPageQuery = {},
): Promise<{ items: AppPhieuHanhChinh[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 5000);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? false;

  const where = buildPhieuStatsWhere(query);

  assertPrismaModel(prisma.cong_luong_phieu_hanh_chinh, 'cong_luong_phieu_hanh_chinh');

  const [total, rows] = await Promise.all([
    prisma.cong_luong_phieu_hanh_chinh.count({ where }),
    prisma.cong_luong_phieu_hanh_chinh.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
      include: phieuInclude,
    }),
  ]);

  return { items: await mapRowsWithNames(rows), total };
}

export async function getPhieuHanhChinhStatsAggregates(
  query: Pick<
    PhieuHanhChinhPageQuery,
    'ma_phieu' | 'trang_thai' | 'id_phong_ban' | 'id_nhan_vien' | 'from' | 'to'
  > = {},
): Promise<PhieuHanhChinhStatsAggregatesResult> {
  assertPrismaModel(prisma.cong_luong_phieu_hanh_chinh, 'cong_luong_phieu_hanh_chinh');

  const where = buildPhieuStatsWhere(query);
  const end = parseDateBound(query.to, true) ?? new Date();
  const prev = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1));
  const months = monthKeysEndingAt(end, 12);

  const detailRows = await prisma.cong_luong_phieu_hanh_chinh.findMany({
    where,
    select: {
      ma_phieu: true,
      id_nhan_vien: true,
      trang_thai: true,
      tu_ngay: true,
      den_ngay: true,
      tg_tao: true,
      nhan_vien: {
        select: {
          id_phong_ban: true,
          phong_ban: { select: { ten_phong_ban: true } },
        },
      },
    },
  });

  let da_duyet = 0;
  let cho_duyet = 0;
  let tu_choi = 0;
  let tong_ngay = 0;
  let createdThisMonth = 0;
  let createdPrevMonth = 0;

  const thisMonthStart = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const thisMonthEnd = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
  const prevMonthStart = new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), 1));
  const prevMonthEnd = new Date(
    Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );

  const byTypeMap = new Map<string, { id: string; name: string; count: number }>();
  const byStatusMap = new Map<string, number>();
  const byDeptMap = new Map<string, { id: string | null; name: string; count: number }>();
  const byMonthMap: Record<string, number> = {};
  for (const m of months) byMonthMap[m] = 0;

  const typeSummaryMap = new Map<
    string,
    {
      id: string;
      name: string;
      total: number;
      da_duyet: number;
      cho_duyet: number;
      tu_choi: number;
      tong_ngay: number;
    }
  >();

  for (const row of detailRows) {
    const typeId = row.ma_phieu;
    const typeName = getTenLoaiPhieu(row.ma_phieu) ?? row.ma_phieu;

    const t = byTypeMap.get(typeId) ?? { id: typeId, name: typeName, count: 0 };
    t.count++;
    byTypeMap.set(typeId, t);

    byStatusMap.set(row.trang_thai, (byStatusMap.get(row.trang_thai) ?? 0) + 1);

    const deptId = row.nhan_vien?.id_phong_ban ?? null;
    const deptKey = deptId == null ? '__none__' : String(deptId);
    const d =
      byDeptMap.get(deptKey) ??
      {
        id: deptId == null ? null : String(deptId),
        name:
          row.nhan_vien?.phong_ban?.ten_phong_ban ??
          (deptId == null ? 'Chưa phân bổ' : `PB #${deptId}`),
        count: 0,
      };
    d.count++;
    byDeptMap.set(deptKey, d);

    const mk = monthKey(row.tu_ngay);
    if (mk in byMonthMap) {
      byMonthMap[mk] = (byMonthMap[mk] ?? 0) + 1;
    }

    const soNgay = computeSoNgay(row.tu_ngay, row.den_ngay);
    const isApproved = row.trang_thai === 'da_duyet';
    const isPending =
      row.trang_thai === 'cho_ql_duyet' || row.trang_thai === 'cho_hcns_duyet';
    const isRejected = row.trang_thai === 'tu_choi';

    if (isApproved) {
      da_duyet++;
      tong_ngay += soNgay;
    } else if (isPending) {
      cho_duyet++;
    } else if (isRejected) {
      tu_choi++;
    }

    const created = row.tg_tao;
    if (created >= thisMonthStart && created <= thisMonthEnd) createdThisMonth++;
    else if (created >= prevMonthStart && created <= prevMonthEnd) createdPrevMonth++;

    let summary = typeSummaryMap.get(typeId);
    if (!summary) {
      summary = {
        id: typeId,
        name: typeName,
        total: 0,
        da_duyet: 0,
        cho_duyet: 0,
        tu_choi: 0,
        tong_ngay: 0,
      };
      typeSummaryMap.set(typeId, summary);
    }
    summary.total++;
    if (isApproved) {
      summary.da_duyet++;
      summary.tong_ngay += soNgay;
    } else if (isPending) {
      summary.cho_duyet++;
    } else if (isRejected) {
      summary.tu_choi++;
    }
  }

  return {
    kpis: {
      total: detailRows.length,
      da_duyet,
      cho_duyet,
      tu_choi,
      tong_ngay,
      typeCount: byTypeMap.size,
      createdThisMonth,
      createdPrevMonth,
    },
    byType: [...byTypeMap.values()].sort((a, b) => b.count - a.count),
    byStatus: [...byStatusMap.entries()].map(([key, count]) => ({ key, count })),
    byDepartment: [...byDeptMap.values()].sort((a, b) => b.count - a.count),
    byMonth: months.map((month) => ({ month, count: byMonthMap[month] ?? 0 })),
    typeSummary: [...typeSummaryMap.values()]
      .map((row) => ({
        ...row,
        avg_ngay:
          row.da_duyet > 0
            ? Math.round((row.tong_ngay / row.da_duyet) * 100) / 100
            : 0,
      }))
      .sort((a, b) => b.total - a.total),
  };
}

export async function createPhieuHanhChinh(
  input: PhieuHanhChinhCreateInput,
): Promise<AppPhieuHanhChinh> {
  const maPhieu = input.ma_phieu?.trim().toUpperCase();
  const idNv = toDbId(input.id_nhan_vien);
  if (!maPhieu) throw new Error('ma_phieu là bắt buộc');
  if (idNv == null) throw new Error('id_nhan_vien là bắt buộc');

  const tuNgay = parseDateOnly(input.tu_ngay);
  const denNgay = parseDateOnly(input.den_ngay);
  if (!tuNgay) throw new Error('tu_ngay không hợp lệ');
  if (!denNgay) throw new Error('den_ngay không hợp lệ');

  const now = new Date();
  const inserted = await prisma.cong_luong_phieu_hanh_chinh.create({
    data: {
      ma_phieu: maPhieu,
      id_nhan_vien: idNv,
      tu_ngay: tuNgay,
      buoi_bat_dau: input.buoi_bat_dau,
      den_ngay: denNgay,
      buoi_ket_thuc: input.buoi_ket_thuc,
      gio_bat_dau: input.gio_bat_dau ?? null,
      gio_ket_thuc: input.gio_ket_thuc ?? null,
      ly_do: input.ly_do ?? null,
      hinh_anh: input.hinh_anh ?? [],
      trang_thai: 'cho_ql_duyet',
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const item = await findPhieuHanhChinhById(inserted.id);
  if (!item) throw new Error('Failed to load created phiếu hành chính');
  return item;
}

export async function updatePhieuHanhChinh(
  id: number,
  input: PhieuHanhChinhUpdateInput,
  options?: { allowLocked?: boolean },
): Promise<AppPhieuHanhChinh | null> {
  const existing = await prisma.cong_luong_phieu_hanh_chinh.findUnique({ where: { id } });
  if (!existing) return null;
  const canEditStatus =
    existing.trang_thai === 'cho_ql_duyet' ||
    ((existing.trang_thai === 'cho_hcns_duyet' ||
      existing.trang_thai === 'da_duyet') &&
      options?.allowLocked === true);
  if (!canEditStatus) {
    throw new Error('Trạng thái phiếu không cho phép chỉnh sửa');
  }

  const maPhieu =
    input.ma_phieu != null ? input.ma_phieu.trim().toUpperCase() : undefined;
  const idNv = input.id_nhan_vien != null ? toDbId(input.id_nhan_vien) : undefined;

  await prisma.cong_luong_phieu_hanh_chinh.update({
    where: { id },
    data: {
      ...(maPhieu ? { ma_phieu: maPhieu } : {}),
      ...(idNv != null ? { id_nhan_vien: idNv } : {}),
      ...(input.tu_ngay !== undefined
        ? { tu_ngay: parseDateOnly(input.tu_ngay) ?? existing.tu_ngay }
        : {}),
      ...(input.buoi_bat_dau != null ? { buoi_bat_dau: input.buoi_bat_dau } : {}),
      ...(input.den_ngay !== undefined
        ? { den_ngay: parseDateOnly(input.den_ngay) ?? existing.den_ngay }
        : {}),
      ...(input.buoi_ket_thuc != null ? { buoi_ket_thuc: input.buoi_ket_thuc } : {}),
      ...(input.gio_bat_dau !== undefined ? { gio_bat_dau: input.gio_bat_dau } : {}),
      ...(input.gio_ket_thuc !== undefined ? { gio_ket_thuc: input.gio_ket_thuc } : {}),
      ...(input.ly_do !== undefined ? { ly_do: input.ly_do } : {}),
      ...(input.hinh_anh !== undefined ? { hinh_anh: input.hinh_anh } : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findPhieuHanhChinhById(id);
}

export async function approvePhieuQl(
  id: number,
  approverId: string | null | undefined,
  ghiChu?: string | null,
): Promise<AppPhieuHanhChinh | null> {
  const existing = await prisma.cong_luong_phieu_hanh_chinh.findUnique({ where: { id } });
  if (!existing) return null;
  if (existing.trang_thai !== 'cho_ql_duyet') {
    throw new Error('Phiếu không ở trạng thái chờ QL duyệt');
  }

  const now = new Date();
  await prisma.cong_luong_phieu_hanh_chinh.update({
    where: { id },
    data: {
      trang_thai: 'cho_hcns_duyet',
      id_ql_duyet: toDbId(approverId),
      tg_ql_duyet: now,
      ghi_chu_ql: ghiChu?.trim() || null,
      tg_cap_nhat: now,
    },
  });
  return findPhieuHanhChinhById(id);
}

export async function approvePhieuHcns(
  id: number,
  approverId: string | null | undefined,
  ghiChu?: string | null,
): Promise<AppPhieuHanhChinh | null> {
  const existing = await prisma.cong_luong_phieu_hanh_chinh.findUnique({ where: { id } });
  if (!existing) return null;
  if (existing.trang_thai !== 'cho_hcns_duyet') {
    throw new Error('Phiếu không ở trạng thái chờ HCNS duyệt');
  }

  const now = new Date();
  await prisma.cong_luong_phieu_hanh_chinh.update({
    where: { id },
    data: {
      trang_thai: 'da_duyet',
      id_hcns_duyet: toDbId(approverId),
      tg_hcns_duyet: now,
      ghi_chu_hcns: ghiChu?.trim() || null,
      tg_cap_nhat: now,
    },
  });
  return findPhieuHanhChinhById(id);
}

export async function rejectPhieuHanhChinh(
  id: number,
  approverId: string | null | undefined,
  lyDoTuChoi: string,
): Promise<AppPhieuHanhChinh | null> {
  const existing = await prisma.cong_luong_phieu_hanh_chinh.findUnique({ where: { id } });
  if (!existing) return null;
  if (
    existing.trang_thai !== 'cho_ql_duyet' &&
    existing.trang_thai !== 'cho_hcns_duyet'
  ) {
    throw new Error('Chỉ từ chối phiếu đang chờ duyệt');
  }

  const now = new Date();
  const isQl = existing.trang_thai === 'cho_ql_duyet';
  await prisma.cong_luong_phieu_hanh_chinh.update({
    where: { id },
    data: {
      trang_thai: 'tu_choi',
      ly_do_tu_choi: lyDoTuChoi.trim(),
      ...(isQl
        ? {
            id_ql_duyet: toDbId(approverId),
            tg_ql_duyet: now,
            ghi_chu_ql: lyDoTuChoi.trim(),
          }
        : {
            id_hcns_duyet: toDbId(approverId),
            tg_hcns_duyet: now,
            ghi_chu_hcns: lyDoTuChoi.trim(),
          }),
      tg_cap_nhat: now,
    },
  });
  return findPhieuHanhChinhById(id);
}

/** Nhân sự tự hủy phiếu đang chờ duyệt (QL hoặc HCNS). */
export async function cancelPhieuHanhChinh(
  id: number,
  actorId: string | null | undefined,
): Promise<AppPhieuHanhChinh | null> {
  const existing = await prisma.cong_luong_phieu_hanh_chinh.findUnique({ where: { id } });
  if (!existing) return null;
  if (existing.trang_thai !== 'cho_ql_duyet') {
    throw new Error('Chỉ hủy được phiếu đang chờ QL duyệt');
  }
  const actor = actorId == null ? null : String(actorId);
  const isOwner =
    actor != null &&
    (String(existing.id_nhan_vien) === actor ||
      (existing.nguoi_tao != null && String(existing.nguoi_tao) === actor));
  if (!isOwner) {
    throw new Error('Chỉ nhân sự liên quan mới được hủy phiếu');
  }

  const now = new Date();
  await prisma.cong_luong_phieu_hanh_chinh.update({
    where: { id },
    data: {
      trang_thai: 'da_huy',
      tg_cap_nhat: now,
    },
  });
  return findPhieuHanhChinhById(id);
}

export async function deletePhieuHanhChinh(id: number): Promise<boolean> {
  try {
    await prisma.cong_luong_phieu_hanh_chinh.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function getPhieuHanhChinhNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.cong_luong_phieu_hanh_chinh.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}
