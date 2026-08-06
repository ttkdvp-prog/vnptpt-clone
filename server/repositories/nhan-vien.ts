import { prisma } from '@/server/db';
import {
  mapEmployeeFromDb,
  mapNhanVienTrangThaiToDb,
  toDbId,
  type AppEmployee,
  type DbNhanVien,
} from '@/server/mappers';
import type { Prisma } from '@prisma/client';
import {
  appStatusKeyFromDb,
  buildEmployeeWhere,
  type NhanVienListFilters,
} from '@/server/repositories/nhan-vien-list-query';

const employeeInclude = {
  chuc_vu: { select: { ten_chuc_vu: true } },
  phong_ban: { select: { ten_phong_ban: true } },
} as const;

type PrismaEmployeeRow = Prisma.var_nhan_vienGetPayload<{ include: typeof employeeInclude }>;

function toDbNhanVien(row: PrismaEmployeeRow): DbNhanVien {
  return {
    id: row.id,
    ho_va_ten: row.ho_va_ten,
    hinh_anh: row.hinh_anh,
    email: row.email,
    email_ca_nhan: row.email_ca_nhan,
    so_dien_thoai: row.so_dien_thoai,
    gioi_tinh: row.gioi_tinh,
    ngay_sinh: row.ngay_sinh,
    so_cccd: row.so_cccd,
    ngay_cap_cccd: row.ngay_cap_cccd,
    noi_cap_cccd: row.noi_cap_cccd,
    dia_chi_thuong_tru: row.dia_chi_thuong_tru,
    dia_chi_hien_tai: row.dia_chi_hien_tai,
    que_quan: row.que_quan,
    dan_toc: row.dan_toc,
    ton_giao: row.ton_giao,
    tinh_trang_hon_nhan: row.tinh_trang_hon_nhan,
    quoc_tich: row.quoc_tich,
    ngay_vao_lam: row.ngay_vao_lam,
    ngay_chinh_thuc: row.ngay_chinh_thuc,
    ngay_nghi_viec: row.ngay_nghi_viec,
    ly_do_nghi: row.ly_do_nghi,
    so_tai_khoan: row.so_tai_khoan,
    ten_chu_tai_khoan: row.ten_chu_tai_khoan,
    ngan_hang: row.ngan_hang,
    chi_nhanh: row.chi_nhanh,
    nguoi_lien_he_khan: row.nguoi_lien_he_khan,
    sdt_khan: row.sdt_khan,
    moi_quan_he: row.moi_quan_he,
    so_so_bhxh: row.so_so_bhxh,
    so_bhyt: row.so_bhyt,
    ma_so_thue_ca_nhan: row.ma_so_thue_ca_nhan,
    trinh_do: row.trinh_do,
    chuyen_nganh: row.chuyen_nganh,
    truong: row.truong,
    trang_thai: row.trang_thai,
    id_chuc_vu: row.id_chuc_vu,
    id_phong_ban: row.id_phong_ban,
    cap_bac: row.cap_bac,
    tai_khoan: row.tai_khoan,
    must_change_password: row.must_change_password,
    nguoi_tao: row.nguoi_tao,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    ten_chuc_vu: row.chuc_vu?.ten_chuc_vu ?? null,
    ten_phong_ban: row.phong_ban?.ten_phong_ban ?? null,
  };
}

/** Parse YYYY-MM-DD → Date; empty → null; undefined → undefined (skip update). */
function parseDateOnlyInput(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value == null || String(value).trim() === '') return null;
  const s = String(value).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(`${s}T00:00:00.000Z`);
}

function nullishTrimmed(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

export interface NhanVienPageQuery extends NhanVienListFilters {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

/** Max page size for list UI (page sizes 10–100). */
export const NHAN_VIEN_LIST_MAX_LIMIT = 100;

export interface NhanVienFilterCountsResult {
  deptCounts: Record<string, number>;
  posCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  genderCounts: Record<string, number>;
}

export interface NhanVienStatsAggregatesResult {
  kpis: {
    total: number;
    active: number;
    probation: number;
    inactive: number;
    hiredThisMonth: number;
    hiredPrevMonth: number;
  };
  byDept: Array<{ id: string | null; name: string; count: number }>;
  byStatus: Array<{ key: string; count: number }>;
  byGender: Array<{ key: string; count: number }>;
  hiresByMonth: Array<{ month: string; count: number }>;
  deptSummary: Array<{
    id: string | null;
    name: string;
    total: number;
    active: number;
    probation: number;
    inactive: number;
  }>;
}

export interface NhanVienCreateInput {
  ho_ten: string;
  tai_khoan: string;
  mat_khau_hash: string;
  email?: string;
  email_ca_nhan?: string | null;
  so_dien_thoai?: string;
  gioi_tinh?: string;
  ngay_sinh?: string | null;
  so_cccd?: string | null;
  ngay_cap_cccd?: string | null;
  noi_cap_cccd?: string | null;
  dia_chi_thuong_tru?: string | null;
  dia_chi_hien_tai?: string | null;
  que_quan?: string | null;
  dan_toc?: string | null;
  ton_giao?: string | null;
  tinh_trang_hon_nhan?: string | null;
  quoc_tich?: string | null;
  ngay_vao_lam?: string | null;
  ngay_chinh_thuc?: string | null;
  ngay_nghi_viec?: string | null;
  ly_do_nghi?: string | null;
  so_tai_khoan?: string | null;
  ten_chu_tai_khoan?: string | null;
  ngan_hang?: string | null;
  chi_nhanh?: string | null;
  nguoi_lien_he_khan?: string | null;
  sdt_khan?: string | null;
  moi_quan_he?: string | null;
  so_so_bhxh?: string | null;
  so_bhyt?: string | null;
  ma_so_thue_ca_nhan?: string | null;
  trinh_do?: string | null;
  chuyen_nganh?: string | null;
  truong?: string | null;
  phong_ban_id?: string | null;
  chuc_vu_id?: string | null;
  cap_bac?: number | null;
  trang_thai?: string;
  anh_dai_dien?: string | null;
  must_change_password?: boolean;
  nguoi_tao?: string | null;
}

export interface NhanVienUpdateInput {
  ho_ten?: string;
  tai_khoan?: string;
  mat_khau_hash?: string;
  email?: string;
  email_ca_nhan?: string | null;
  so_dien_thoai?: string;
  gioi_tinh?: string;
  ngay_sinh?: string | null;
  so_cccd?: string | null;
  ngay_cap_cccd?: string | null;
  noi_cap_cccd?: string | null;
  dia_chi_thuong_tru?: string | null;
  dia_chi_hien_tai?: string | null;
  que_quan?: string | null;
  dan_toc?: string | null;
  ton_giao?: string | null;
  tinh_trang_hon_nhan?: string | null;
  quoc_tich?: string | null;
  ngay_vao_lam?: string | null;
  ngay_chinh_thuc?: string | null;
  ngay_nghi_viec?: string | null;
  ly_do_nghi?: string | null;
  so_tai_khoan?: string | null;
  ten_chu_tai_khoan?: string | null;
  ngan_hang?: string | null;
  chi_nhanh?: string | null;
  nguoi_lien_he_khan?: string | null;
  sdt_khan?: string | null;
  moi_quan_he?: string | null;
  so_so_bhxh?: string | null;
  so_bhyt?: string | null;
  ma_so_thue_ca_nhan?: string | null;
  trinh_do?: string | null;
  chuyen_nganh?: string | null;
  truong?: string | null;
  phong_ban_id?: string | null;
  chuc_vu_id?: string | null;
  cap_bac?: number | null;
  trang_thai?: string;
  anh_dai_dien?: string | null;
  must_change_password?: boolean;
}

function buildOrderBy(
  orderBy: string | undefined,
  ascending: boolean,
): Prisma.var_nhan_vienOrderByWithRelationInput {
  const dir = ascending ? 'asc' : 'desc';
  switch (orderBy) {
    case 'ho_ten':
    case 'ho_va_ten':
      return { ho_va_ten: dir };
    case 'tai_khoan':
    case 'ten_dang_nhap':
      return { tai_khoan: dir };
    case 'tg_tao':
      return { tg_tao: dir };
    case 'tg_cap_nhat':
      return { tg_cap_nhat: dir };
    default:
      return { id: dir };
  }
}

export async function findEmployeeById(id: number): Promise<AppEmployee | null> {
  const row = await prisma.var_nhan_vien.findUnique({
    where: { id },
    include: employeeInclude,
  });
  return row ? mapEmployeeFromDb(toDbNhanVien(row)) : null;
}

/** Lấy nhiều nhân viên theo ids trong 1 lần query — dùng cho bulk actions (reset password, ...). */
export async function findEmployeesByIds(ids: number[]): Promise<AppEmployee[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.var_nhan_vien.findMany({
    where: { id: { in: ids } },
    include: employeeInclude,
  });
  return rows.map((row) => mapEmployeeFromDb(toDbNhanVien(row)));
}

export async function findEmployeeByLogin(taiKhoan: string): Promise<AppEmployee | null> {
  const row = await prisma.var_nhan_vien.findFirst({
    where: { tai_khoan: { equals: taiKhoan, mode: 'insensitive' } },
    include: employeeInclude,
  });
  return row ? mapEmployeeFromDb(toDbNhanVien(row)) : null;
}

export async function countEmployees(filters: NhanVienListFilters = {}): Promise<number> {
  return prisma.var_nhan_vien.count({ where: buildEmployeeWhere(filters) });
}

export async function findEmployeesPage(
  query: NhanVienPageQuery = {},
): Promise<{ items: AppEmployee[]; total: number }> {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), NHAN_VIEN_LIST_MAX_LIMIT);
  const offset = Math.max(query.offset ?? 0, 0);
  const ascending = query.ascending ?? true;
  const where = buildEmployeeWhere(query);

  const [total, rows] = await Promise.all([
    prisma.var_nhan_vien.count({ where }),
    prisma.var_nhan_vien.findMany({
      where,
      orderBy: buildOrderBy(query.orderBy, ascending),
      skip: offset,
      take: limit,
      include: employeeInclude,
    }),
  ]);

  return {
    items: rows.map((row) => mapEmployeeFromDb(toDbNhanVien(row))),
    total,
  };
}

async function groupCountBy(
  where: Prisma.var_nhan_vienWhereInput,
  field: 'id_phong_ban' | 'id_chuc_vu' | 'trang_thai' | 'gioi_tinh',
): Promise<Array<{ key: string | null; count: number }>> {
  const rows = await prisma.var_nhan_vien.groupBy({
    by: [field],
    where,
    _count: { _all: true },
  });
  return rows.map((r) => ({
    key: r[field] == null ? null : String(r[field]),
    count: r._count._all,
  }));
}

/** Exclude-self facet counts for toolbar chips. */
export async function getEmployeeFilterCounts(
  filters: NhanVienListFilters = {},
): Promise<NhanVienFilterCountsResult> {
  const [deptRows, posRows, statusRows, genderRows] = await Promise.all([
    groupCountBy(buildEmployeeWhere(filters, 'phong_ban_id'), 'id_phong_ban'),
    groupCountBy(buildEmployeeWhere(filters, 'chuc_vu_id'), 'id_chuc_vu'),
    groupCountBy(buildEmployeeWhere(filters, 'trang_thai'), 'trang_thai'),
    groupCountBy(buildEmployeeWhere(filters, 'gioi_tinh'), 'gioi_tinh'),
  ]);

  const deptCounts: Record<string, number> = {};
  for (const r of deptRows) {
    if (r.key) deptCounts[r.key] = r.count;
  }
  const posCounts: Record<string, number> = {};
  for (const r of posRows) {
    if (r.key) posCounts[r.key] = r.count;
  }
  const statusCounts: Record<string, number> = {};
  for (const r of statusRows) {
    if (!r.key) continue;
    const appKey = appStatusKeyFromDb(r.key);
    statusCounts[appKey] = (statusCounts[appKey] ?? 0) + r.count;
  }
  const genderCounts: Record<string, number> = {};
  for (const r of genderRows) {
    if (r.key) genderCounts[r.key] = r.count;
  }

  return { deptCounts, posCounts, statusCounts, genderCounts };
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

export async function getEmployeeStatsAggregates(
  filters: NhanVienListFilters = {},
): Promise<NhanVienStatsAggregatesResult> {
  const where = buildEmployeeWhere(filters);
  const end = filters.asAt
    ? new Date(filters.asAt instanceof Date ? filters.asAt : filters.asAt)
    : filters.dateTo
      ? new Date(filters.dateTo instanceof Date ? filters.dateTo : filters.dateTo)
      : new Date();

  const prev = new Date(end.getFullYear(), end.getMonth() - 1, 1);
  const months = monthKeysEndingAt(end, 12);

  const [
    total,
    active,
    probation,
    leave,
    inactive,
    hiredThisMonth,
    hiredPrevMonth,
    byDeptRaw,
    byStatusRaw,
    byGenderRaw,
    hireRows,
    byDeptStatusRaw,
  ] = await Promise.all([
    prisma.var_nhan_vien.count({ where }),
    prisma.var_nhan_vien.count({
      where: { AND: [where, { trang_thai: 'ACTIVE' }] },
    }),
    prisma.var_nhan_vien.count({
      where: { AND: [where, { trang_thai: 'PROBATION' }] },
    }),
    prisma.var_nhan_vien.count({
      where: { AND: [where, { trang_thai: 'LEAVE' }] },
    }),
    prisma.var_nhan_vien.count({
      where: { AND: [where, { trang_thai: 'INACTIVE' }] },
    }),
    prisma.var_nhan_vien.count({
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
    prisma.var_nhan_vien.count({
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
    prisma.var_nhan_vien.groupBy({
      by: ['id_phong_ban'],
      where,
      _count: { _all: true },
    }),
    prisma.var_nhan_vien.groupBy({
      by: ['trang_thai'],
      where,
      _count: { _all: true },
    }),
    prisma.var_nhan_vien.groupBy({
      by: ['gioi_tinh'],
      where,
      _count: { _all: true },
    }),
    prisma.var_nhan_vien.findMany({
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
    // Trước đây là findMany không `take` — fetch TOÀN BẢNG nhân viên khớp
    // filter chỉ để đếm active/probation/inactive theo từng phòng ban ở JS.
    // groupBy(['id_phong_ban','trang_thai']) làm đúng việc đó ở DB — kết quả
    // trả về chỉ scale theo (số phòng ban × số trạng thái), không theo headcount.
    prisma.var_nhan_vien.groupBy({
      by: ['id_phong_ban', 'trang_thai'],
      where,
      _count: { _all: true },
    }),
  ]);

  const deptIds = byDeptRaw
    .map((r) => r.id_phong_ban)
    .filter((id): id is number => id != null);
  const deptNames =
    deptIds.length > 0
      ? await prisma.var_phong_ban.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, ten_phong_ban: true },
        })
      : [];
  const deptNameMap = new Map(deptNames.map((d) => [d.id, d.ten_phong_ban]));

  const byDept = byDeptRaw
    .map((r) => ({
      id: r.id_phong_ban == null ? null : String(r.id_phong_ban),
      name:
        r.id_phong_ban == null
          ? 'Chưa phân bổ'
          : (deptNameMap.get(r.id_phong_ban) ?? 'Chưa phân bổ'),
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const statusMap: Record<string, number> = {};
  for (const r of byStatusRaw) {
    const key = appStatusKeyFromDb(r.trang_thai);
    statusMap[key] = (statusMap[key] ?? 0) + r._count._all;
  }
  const byStatus = Object.entries(statusMap).map(([key, count]) => ({ key, count }));

  const byGender = byGenderRaw.map((r) => ({
    key: r.gioi_tinh ?? 'Khác',
    count: r._count._all,
  }));

  const hireCountByMonth: Record<string, number> = {};
  for (const m of months) hireCountByMonth[m] = 0;
  for (const row of hireRows) {
    const k = monthKey(row.tg_tao);
    if (k in hireCountByMonth) hireCountByMonth[k] = (hireCountByMonth[k] ?? 0) + 1;
  }
  const hiresByMonth = months.map((month) => ({
    month,
    count: hireCountByMonth[month] ?? 0,
  }));

  // Key by department id (not name) so duplicate names don't merge and
  // drill-down can target the exact department. null id = "Chưa phân bổ".
  // deptNameMap đã tra ở byDept phía trên — cùng `where` nên tập id_phong_ban
  // xuất hiện ở đây là tập con của deptIds, tra lại được luôn không cần query mới.
  const deptSummaryMap: Record<
    string,
    { id: string | null; name: string; total: number; active: number; probation: number; inactive: number }
  > = {};
  for (const row of byDeptStatusRaw) {
    const id = row.id_phong_ban == null ? null : String(row.id_phong_ban);
    const key = id ?? '__none__';
    if (!deptSummaryMap[key]) {
      deptSummaryMap[key] = {
        id,
        name:
          row.id_phong_ban == null
            ? 'Chưa phân bổ'
            : (deptNameMap.get(row.id_phong_ban) ?? 'Chưa phân bổ'),
        total: 0,
        active: 0,
        probation: 0,
        inactive: 0,
      };
    }
    const bucket = deptSummaryMap[key]!;
    const count = row._count._all;
    bucket.total += count;
    const app = appStatusKeyFromDb(row.trang_thai);
    if (app === 'Đang làm việc') bucket.active += count;
    else if (app === 'Thử việc') bucket.probation += count;
    else bucket.inactive += count;
  }
  const deptSummary = Object.values(deptSummaryMap).sort((a, b) => b.total - a.total);

  return {
    kpis: {
      total,
      active,
      probation,
      inactive: inactive + leave,
      hiredThisMonth,
      hiredPrevMonth,
    },
    byDept,
    byStatus,
    byGender,
    hiresByMonth,
    deptSummary,
  };
}

export async function createEmployee(input: NhanVienCreateInput): Promise<AppEmployee> {
  const now = new Date();
  const inserted = await prisma.var_nhan_vien.create({
    data: {
      ho_va_ten: input.ho_ten,
      hinh_anh: input.anh_dai_dien ?? null,
      email: input.email ?? '',
      email_ca_nhan: nullishTrimmed(input.email_ca_nhan) ?? null,
      so_dien_thoai: input.so_dien_thoai ?? '',
      gioi_tinh: input.gioi_tinh ?? 'Nam',
      ngay_sinh: parseDateOnlyInput(input.ngay_sinh) ?? null,
      so_cccd: nullishTrimmed(input.so_cccd) ?? null,
      ngay_cap_cccd: parseDateOnlyInput(input.ngay_cap_cccd) ?? null,
      noi_cap_cccd: nullishTrimmed(input.noi_cap_cccd) ?? null,
      dia_chi_thuong_tru: nullishTrimmed(input.dia_chi_thuong_tru) ?? null,
      dia_chi_hien_tai: nullishTrimmed(input.dia_chi_hien_tai) ?? null,
      que_quan: nullishTrimmed(input.que_quan) ?? null,
      dan_toc: nullishTrimmed(input.dan_toc) ?? null,
      ton_giao: nullishTrimmed(input.ton_giao) ?? null,
      tinh_trang_hon_nhan: nullishTrimmed(input.tinh_trang_hon_nhan) ?? null,
      quoc_tich: nullishTrimmed(input.quoc_tich) ?? null,
      ngay_vao_lam: parseDateOnlyInput(input.ngay_vao_lam) ?? null,
      ngay_chinh_thuc: parseDateOnlyInput(input.ngay_chinh_thuc) ?? null,
      ngay_nghi_viec: parseDateOnlyInput(input.ngay_nghi_viec) ?? null,
      ly_do_nghi: nullishTrimmed(input.ly_do_nghi) ?? null,
      so_tai_khoan: nullishTrimmed(input.so_tai_khoan) ?? null,
      ten_chu_tai_khoan: nullishTrimmed(input.ten_chu_tai_khoan) ?? null,
      ngan_hang: nullishTrimmed(input.ngan_hang) ?? null,
      chi_nhanh: nullishTrimmed(input.chi_nhanh) ?? null,
      nguoi_lien_he_khan: nullishTrimmed(input.nguoi_lien_he_khan) ?? null,
      sdt_khan: nullishTrimmed(input.sdt_khan) ?? null,
      moi_quan_he: nullishTrimmed(input.moi_quan_he) ?? null,
      so_so_bhxh: nullishTrimmed(input.so_so_bhxh) ?? null,
      so_bhyt: nullishTrimmed(input.so_bhyt) ?? null,
      ma_so_thue_ca_nhan: nullishTrimmed(input.ma_so_thue_ca_nhan) ?? null,
      trinh_do: nullishTrimmed(input.trinh_do) ?? null,
      chuyen_nganh: nullishTrimmed(input.chuyen_nganh) ?? null,
      truong: nullishTrimmed(input.truong) ?? null,
      trang_thai: mapNhanVienTrangThaiToDb(input.trang_thai ?? 'Đang làm việc'),
      id_chuc_vu: toDbId(input.chuc_vu_id),
      id_phong_ban: toDbId(input.phong_ban_id),
      cap_bac: input.cap_bac ?? null,
      tai_khoan: input.tai_khoan,
      mat_khau: input.mat_khau_hash,
      must_change_password: input.must_change_password ?? true,
      nguoi_tao: toDbId(input.nguoi_tao),
      tg_tao: now,
      tg_cap_nhat: now,
    },
  });
  const employee = await findEmployeeById(inserted.id);
  if (!employee) throw new Error('Failed to load created employee');
  return employee;
}

export async function updateEmployee(
  id: number,
  input: NhanVienUpdateInput,
): Promise<AppEmployee | null> {
  const existing = await prisma.var_nhan_vien.findUnique({ where: { id } });
  if (!existing) return null;

  const ngaySinh = parseDateOnlyInput(input.ngay_sinh);
  const ngayCapCccd = parseDateOnlyInput(input.ngay_cap_cccd);
  const ngayVaoLam = parseDateOnlyInput(input.ngay_vao_lam);
  const ngayChinhThuc = parseDateOnlyInput(input.ngay_chinh_thuc);
  const ngayNghiViec = parseDateOnlyInput(input.ngay_nghi_viec);

  await prisma.var_nhan_vien.update({
    where: { id },
    data: {
      ...(input.ho_ten != null ? { ho_va_ten: input.ho_ten } : {}),
      ...(input.tai_khoan != null ? { tai_khoan: input.tai_khoan } : {}),
      ...(input.mat_khau_hash != null ? { mat_khau: input.mat_khau_hash } : {}),
      ...(input.email != null ? { email: input.email } : {}),
      ...(input.so_dien_thoai != null ? { so_dien_thoai: input.so_dien_thoai } : {}),
      ...(input.gioi_tinh != null ? { gioi_tinh: input.gioi_tinh } : {}),
      ...(ngaySinh !== undefined ? { ngay_sinh: ngaySinh } : {}),
      ...(nullishTrimmed(input.so_cccd) !== undefined
        ? { so_cccd: nullishTrimmed(input.so_cccd) }
        : {}),
      ...(ngayCapCccd !== undefined ? { ngay_cap_cccd: ngayCapCccd } : {}),
      ...(nullishTrimmed(input.noi_cap_cccd) !== undefined
        ? { noi_cap_cccd: nullishTrimmed(input.noi_cap_cccd) }
        : {}),
      ...(nullishTrimmed(input.dia_chi_thuong_tru) !== undefined
        ? { dia_chi_thuong_tru: nullishTrimmed(input.dia_chi_thuong_tru) }
        : {}),
      ...(nullishTrimmed(input.dia_chi_hien_tai) !== undefined
        ? { dia_chi_hien_tai: nullishTrimmed(input.dia_chi_hien_tai) }
        : {}),
      ...(nullishTrimmed(input.email_ca_nhan) !== undefined
        ? { email_ca_nhan: nullishTrimmed(input.email_ca_nhan) }
        : {}),
      ...(nullishTrimmed(input.que_quan) !== undefined
        ? { que_quan: nullishTrimmed(input.que_quan) }
        : {}),
      ...(nullishTrimmed(input.dan_toc) !== undefined
        ? { dan_toc: nullishTrimmed(input.dan_toc) }
        : {}),
      ...(nullishTrimmed(input.ton_giao) !== undefined
        ? { ton_giao: nullishTrimmed(input.ton_giao) }
        : {}),
      ...(nullishTrimmed(input.tinh_trang_hon_nhan) !== undefined
        ? { tinh_trang_hon_nhan: nullishTrimmed(input.tinh_trang_hon_nhan) }
        : {}),
      ...(nullishTrimmed(input.quoc_tich) !== undefined
        ? { quoc_tich: nullishTrimmed(input.quoc_tich) }
        : {}),
      ...(ngayVaoLam !== undefined ? { ngay_vao_lam: ngayVaoLam } : {}),
      ...(ngayChinhThuc !== undefined ? { ngay_chinh_thuc: ngayChinhThuc } : {}),
      ...(ngayNghiViec !== undefined ? { ngay_nghi_viec: ngayNghiViec } : {}),
      ...(nullishTrimmed(input.ly_do_nghi) !== undefined
        ? { ly_do_nghi: nullishTrimmed(input.ly_do_nghi) }
        : {}),
      ...(nullishTrimmed(input.so_tai_khoan) !== undefined
        ? { so_tai_khoan: nullishTrimmed(input.so_tai_khoan) }
        : {}),
      ...(nullishTrimmed(input.ten_chu_tai_khoan) !== undefined
        ? { ten_chu_tai_khoan: nullishTrimmed(input.ten_chu_tai_khoan) }
        : {}),
      ...(nullishTrimmed(input.ngan_hang) !== undefined
        ? { ngan_hang: nullishTrimmed(input.ngan_hang) }
        : {}),
      ...(nullishTrimmed(input.chi_nhanh) !== undefined
        ? { chi_nhanh: nullishTrimmed(input.chi_nhanh) }
        : {}),
      ...(nullishTrimmed(input.nguoi_lien_he_khan) !== undefined
        ? { nguoi_lien_he_khan: nullishTrimmed(input.nguoi_lien_he_khan) }
        : {}),
      ...(nullishTrimmed(input.sdt_khan) !== undefined
        ? { sdt_khan: nullishTrimmed(input.sdt_khan) }
        : {}),
      ...(nullishTrimmed(input.moi_quan_he) !== undefined
        ? { moi_quan_he: nullishTrimmed(input.moi_quan_he) }
        : {}),
      ...(nullishTrimmed(input.so_so_bhxh) !== undefined
        ? { so_so_bhxh: nullishTrimmed(input.so_so_bhxh) }
        : {}),
      ...(nullishTrimmed(input.so_bhyt) !== undefined
        ? { so_bhyt: nullishTrimmed(input.so_bhyt) }
        : {}),
      ...(nullishTrimmed(input.ma_so_thue_ca_nhan) !== undefined
        ? { ma_so_thue_ca_nhan: nullishTrimmed(input.ma_so_thue_ca_nhan) }
        : {}),
      ...(nullishTrimmed(input.trinh_do) !== undefined
        ? { trinh_do: nullishTrimmed(input.trinh_do) }
        : {}),
      ...(nullishTrimmed(input.chuyen_nganh) !== undefined
        ? { chuyen_nganh: nullishTrimmed(input.chuyen_nganh) }
        : {}),
      ...(nullishTrimmed(input.truong) !== undefined
        ? { truong: nullishTrimmed(input.truong) }
        : {}),
      ...(input.trang_thai != null
        ? { trang_thai: mapNhanVienTrangThaiToDb(input.trang_thai) }
        : {}),
      ...(input.chuc_vu_id !== undefined ? { id_chuc_vu: toDbId(input.chuc_vu_id) } : {}),
      ...(input.phong_ban_id !== undefined ? { id_phong_ban: toDbId(input.phong_ban_id) } : {}),
      ...(input.cap_bac !== undefined ? { cap_bac: input.cap_bac } : {}),
      ...(input.anh_dai_dien !== undefined ? { hinh_anh: input.anh_dai_dien } : {}),
      ...(input.must_change_password != null
        ? { must_change_password: input.must_change_password }
        : {}),
      tg_cap_nhat: new Date(),
    },
  });

  return findEmployeeById(id);
}

export async function deleteEmployee(id: number): Promise<boolean> {
  try {
    await prisma.var_nhan_vien.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/** Đổi trạng thái nhiều nhân viên trong 1 lệnh — tránh N request PATCH đơn lẻ. */
export async function updateEmployeeStatusMany(
  ids: number[],
  trangThai: string,
): Promise<AppEmployee[]> {
  const dbStatus = mapNhanVienTrangThaiToDb(trangThai);
  await prisma.var_nhan_vien.updateMany({
    where: { id: { in: ids } },
    data: { trang_thai: dbStatus, tg_cap_nhat: new Date() },
  });
  return findEmployeesByIds(ids);
}

/** Xóa nhiều nhân viên trong 1 lệnh — tránh N request DELETE đơn lẻ. */
export async function deleteEmployeesMany(ids: number[]): Promise<number> {
  const result = await prisma.var_nhan_vien.deleteMany({ where: { id: { in: ids } } });
  return result.count;
}

export async function getEmployeeNguoiTao(id: number): Promise<string | null> {
  const row = await prisma.var_nhan_vien.findUnique({
    where: { id },
    select: { nguoi_tao: true },
  });
  return row?.nguoi_tao == null ? null : String(row.nguoi_tao);
}

/** Auth credential row (includes password hash). */
export type EmployeeAuthCredential = {
  id: number;
  ho_va_ten: string;
  hinh_anh: string | null;
  email: string | null;
  so_dien_thoai: string | null;
  gioi_tinh: string | null;
  trang_thai: string;
  id_chuc_vu: number | null;
  id_phong_ban: number | null;
  cap_bac: number | null;
  tai_khoan: string;
  mat_khau: string;
  must_change_password: boolean;
  nguoi_tao: number | null;
  tg_tao: Date;
  tg_cap_nhat: Date;
  chuc_vu: { ten_chuc_vu: string } | null;
  phong_ban: { ten_phong_ban: string } | null;
};

export async function findEmployeeAuthByLogin(
  taiKhoan: string,
): Promise<EmployeeAuthCredential | null> {
  return prisma.var_nhan_vien.findFirst({
    where: { tai_khoan: { equals: taiKhoan, mode: 'insensitive' } },
    include: employeeInclude,
  });
}

export async function findEmployeeAuthById(
  id: number,
): Promise<EmployeeAuthCredential | null> {
  return prisma.var_nhan_vien.findUnique({
    where: { id },
    include: employeeInclude,
  });
}

export async function findEmployeePasswordHash(
  id: number,
): Promise<{ id: number; mat_khau: string } | null> {
  return prisma.var_nhan_vien.findUnique({
    where: { id },
    select: { id: true, mat_khau: true },
  });
}

/**
 * Người dùng tự đặt mật khẩu mới ⇒ xoá luôn cờ buộc đổi.
 *
 * Đây là CHỖ DUY NHẤT cờ được xoá hợp lệ, và nó gắn nội tại với một lần ghi mật
 * khẩu thật. Trước đây client chỉ xoá cờ ở local state (`Layout.tsx` patchUser)
 * nên reload là cờ hiện lại; và vì cờ được copy vào JWT, không xoá ở DB sẽ tạo
 * vòng lặp redirect vĩnh viễn vào /doi-mat-khau-bat-buoc.
 */
export async function updateEmployeePassword(
  id: number,
  matKhauHash: string,
): Promise<void> {
  await prisma.var_nhan_vien.update({
    where: { id },
    data: {
      mat_khau: matKhauHash,
      must_change_password: false,
      tg_cap_nhat: new Date(),
    },
  });
}

export async function findEmployeeChucVuId(employeeId: number): Promise<number | null> {
  const row = await prisma.var_nhan_vien.findUnique({
    where: { id: employeeId },
    select: { id_chuc_vu: true },
  });
  return row?.id_chuc_vu ?? null;
}
