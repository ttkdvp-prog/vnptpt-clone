import { Employee, type Gender } from '../core/types';
import {
  createEmployeeCreateSchema,
  createEmployeeSchema,
  type EmployeeCreateFormValues,
  type EmployeeFormValues,
} from '../core/schema';
import { TRANG_THAI_NHAN_VIEN, type TrangThaiNhanVien } from '../core/constants';
import { MOCK_EMPLOYEES } from '@/mocks/he-thong';
import { authEmailToLoginName } from '@/lib/auth-email';
import { createRepository } from '@/lib/data/create-repository';
import { createMockId } from '@/lib/data/mock-id';
import { isApi } from '@/lib/data/config';
import { ApiError } from '@/lib/api/client';
import {
  apiCreateEmployee,
  apiDeleteEmployee,
  apiDeleteEmployeesBatch,
  apiGetEmployeesByIds,
  apiUpdateEmployeeStatusBatch,
  apiGetEmployee,
  apiGetEmployeeByLogin,
  apiGetEmployeeCount,
  apiGetEmployeeFilterCounts,
  apiGetEmployeeStatsAggregates,
  apiGetEmployeesPage,
  apiImportNhanVien,
  apiUpdateEmployee,
  type ApiEmployeeListParams,
  type ApiEmployeeStatsAggregates,
} from '@/lib/api/he-thong';
import {
  provisionEmployeeAuthAccount,
  resetEmployeeAuthPassword,
  changeEmployeeLoginName,
  setEmployeeAuthActive,
  syncEmployeeAuthMetadata,
} from '@/lib/employee-auth/employee-auth-service';
import { shouldDisableAuthForStatus } from '@/lib/employee-auth/constants';
import {
  parseForImport,
  runChunkedImport,
  type BulkImportResult,
  type ImportBatchRow,
  type ImportResult,
} from '@/lib/import';
import { EMPLOYEES_LIST_QUERY_PARAMS } from '@/lib/query-keys';
import { txt } from '@/lib/text';
import { assertAllBatchSucceeded, runInBatchesSettled } from '@/lib/async-utils';
import { getAvatarUrl } from '@/lib/utils';
import { normalizeLoginName } from '@/lib/validation/login-name';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { getDepartments } from '@/features/he-thong/phong-ban/services/phong-ban-service';
import {
  getActivePositions,
  getPositions,
} from '@/features/he-thong/chuc-vu/services/chuc-vu-service';
import type { Department } from '@/features/he-thong/phong-ban/core/types';
import type { Position } from '@/features/he-thong/chuc-vu/core/types';
import { resolveEmployeeOrgUnits } from '../utils/resolve-employee-org-units';
import { findPositionById } from '../utils/build-employee-position-options';
import { getCurrentEmployeeId } from '@/lib/current-session-employee';
import { NHAN_VIEN_SEARCHABLE_KEYS } from '../core/search-keys';
import { employeeMatchesColumnSearch } from '../utils/column-search';
import { countWithExcludeSelf } from '@/lib/factories/createFilterCountsHook';

const now = () => new Date().toISOString();

type LegacyMockEmployee = Employee & {
  ma_nhan_vien?: string;
  ngay_vao_lam?: string;
};

function toEmployee(row: LegacyMockEmployee): Employee {
  const {
    ma_nhan_vien: _ma,
    ngay_vao_lam,
    ...rest
  } = row;
  void _ma;
  return {
    ...rest,
    tg_tao: row.tg_tao ?? (ngay_vao_lam ? new Date(ngay_vao_lam).toISOString() : '2024-01-01T00:00:00.000Z'),
    tg_cap_nhat: row.tg_cap_nhat ?? '2025-01-15T08:30:00.000Z',
  };
}

const mockSeed: Employee[] = MOCK_EMPLOYEES.map((emp) => toEmployee(emp as LegacyMockEmployee));

const repo = createRepository<Employee>({
  tableName: 'var_nhan_vien',
  mockData: mockSeed,
  delay: 600,
});

export type GetEmployeesParams = ApiEmployeeListParams;

function mockMatchesEmployee(emp: Employee, params: GetEmployeesParams): boolean {
  const searchOk = matchesSearchTerm(
    emp as unknown as Record<string, unknown>,
    params.search ?? '',
    NHAN_VIEN_SEARCHABLE_KEYS,
  );
  const statusOk =
    !params.trang_thai?.length || params.trang_thai.includes(emp.trang_thai);
  const deptOk =
    !params.phong_ban_id?.length ||
    Boolean(emp.phong_ban_id && params.phong_ban_id.includes(emp.phong_ban_id));
  const posOk =
    !params.chuc_vu_id?.length ||
    Boolean(emp.chuc_vu_id && params.chuc_vu_id.includes(emp.chuc_vu_id));
  const genderOk =
    !params.gioi_tinh?.length || params.gioi_tinh.includes(emp.gioi_tinh);
  const dateOk =
    (!params.dateFrom || (emp.tg_tao ?? '') >= `${params.dateFrom}T00:00:00.000Z`) &&
    (!params.dateTo || (emp.tg_tao ?? '') <= `${params.dateTo}T23:59:59.999Z`);
  const colOk = employeeMatchesColumnSearch(emp, params.columnSearch ?? {});
  return Boolean(searchOk && statusOk && deptOk && posOk && genderOk && dateOk && colOk);
}

function mockSortEmployees(items: Employee[], orderBy?: string, ascending = true): Employee[] {
  if (!orderBy) return items;
  const mul = ascending ? 1 : -1;
  const key = orderBy === 'ho_ten' || orderBy === 'ho_va_ten' ? 'ho_ten' : orderBy;
  return [...items].sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[key] ?? '';
    const bVal = (b as unknown as Record<string, unknown>)[key] ?? '';
    const cmp =
      typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), 'vi');
    return mul * cmp;
  });
}

function applyEmployeeOrgUnits(emp: Employee, departments: Department[]): Employee {
  const org = resolveEmployeeOrgUnits(emp.phong_ban_id, departments);
  return {
    ...emp,
    ten_phong_ban: org.ten_phong_ban ?? emp.ten_phong_ban,
    ten_bo_phan: org.ten_bo_phan ?? null,
  };
}

function enrichEmployeeRow(
  raw: Employee,
  departments: Department[],
  positions: Position[],
): Employee {
  let emp = applyEmployeeOrgUnits(raw, departments);
  if (!isApi()) {
    const position = positions.find((p) => String(p.id) === String(emp.chuc_vu_id));
    emp = {
      ...emp,
      ten_chuc_vu: position?.ten_chuc_vu ?? emp.ten_chuc_vu,
      cap_bac: position?.cap_bac ?? emp.cap_bac ?? null,
    };
  }
  return emp;
}

async function enrichEmployee(raw: Employee): Promise<Employee> {
  const [departments, positions] = await Promise.all([
    getDepartments(),
    isApi() ? Promise.resolve([] as Position[]) : getPositions(),
  ]);
  return enrichEmployeeRow(raw, departments, positions);
}

async function mapEmployeeRows(list: Employee[]): Promise<Employee[]> {
  const [departments, positions] = await Promise.all([
    getDepartments(),
    isApi() ? Promise.resolve([] as Position[]) : getPositions(),
  ]);
  return list.map((raw) => enrichEmployeeRow(raw, departments, positions));
}

export type EmployeesListResult = {
  items: Employee[];
  total: number;
};

export type EmployeeFilterCountsResult = {
  deptCounts: Record<string, number>;
  posCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  genderCounts: Record<string, number>;
};

export const getEmployeeCount = async (params: GetEmployeesParams = {}): Promise<number> => {
  if (isApi()) {
    const { total } = await apiGetEmployeeCount(params);
    return total;
  }
  const all = await repo.getAll();
  const enriched = await mapEmployeeRows(all);
  return enriched.filter((e) => mockMatchesEmployee(e, params)).length;
};

export const getEmployeesPage = async (
  params: GetEmployeesParams = {},
): Promise<EmployeesListResult> => {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const orderBy = params.orderBy ?? EMPLOYEES_LIST_QUERY_PARAMS.orderBy;
  const ascending = params.ascending ?? EMPLOYEES_LIST_QUERY_PARAMS.ascending;

  if (isApi()) {
    const page = await apiGetEmployeesPage({
      ...params,
      limit,
      offset,
      orderBy,
      ascending,
    });
    return {
      items: await mapEmployeeRows(page.items),
      total: page.total,
    };
  }

  const all = await mapEmployeeRows(await repo.getAll());
  const filtered = mockSortEmployees(
    all.filter((e) => mockMatchesEmployee(e, params)),
    orderBy,
    ascending,
  );
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
};

/**
 * Lấy TOÀN BỘ nhân viên (phân trang đến hết) — dùng cho lookup khi import.
 * Server clamp limit 100/request nên phải page; đừng dùng getEmployees({limit:100}).
 */
export const getAllEmployeesForLookup = async (): Promise<Employee[]> => {
  const pageSize = 100;
  const first = await getEmployeesPage({ limit: pageSize, offset: 0 });
  const all = [...first.items];
  while (all.length < first.total) {
    const page = await getEmployeesPage({ limit: pageSize, offset: all.length });
    if (page.items.length === 0) break;
    all.push(...page.items);
  }
  return all;
};

/** @deprecated Prefer getEmployeesPage — kept for callers that need a single page of items. */
export const getEmployees = async (params: GetEmployeesParams = {}): Promise<Employee[]> => {
  const { items } = await getEmployeesPage({
    ...params,
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
  });
  return items;
};

export const getEmployeeFilterCounts = async (
  params: GetEmployeesParams = {},
): Promise<EmployeeFilterCountsResult> => {
  if (isApi()) {
    return apiGetEmployeeFilterCounts(params);
  }
  const all = await mapEmployeeRows(await repo.getAll());
  const searchTerm = params.search ?? '';
  const baseFilter = (emp: Employee) =>
    matchesSearchTerm(
      emp as unknown as Record<string, unknown>,
      searchTerm,
      NHAN_VIEN_SEARCHABLE_KEYS,
    ) && employeeMatchesColumnSearch(emp, params.columnSearch ?? {});

  const trangThai = params.trang_thai ?? [];
  const phongBan = params.phong_ban_id ?? [];
  const chucVu = params.chuc_vu_id ?? [];
  const gender = params.gioi_tinh ?? [];

  const matchesDept = (emp: Employee) =>
    phongBan.length === 0 ||
    (emp.phong_ban_id != null && phongBan.includes(emp.phong_ban_id));
  const matchesPosition = (emp: Employee) =>
    chucVu.length === 0 || (emp.chuc_vu_id != null && chucVu.includes(emp.chuc_vu_id));
  const matchesStatus = (emp: Employee) =>
    trangThai.length === 0 || trangThai.includes(emp.trang_thai);
  const matchesGender = (emp: Employee) =>
    gender.length === 0 || gender.includes(emp.gioi_tinh);

  const [deptCounts, posCounts, statusCounts, genderCounts] = countWithExcludeSelf(
    all,
    baseFilter,
    [
      {
        passesOthers: (emp) => matchesPosition(emp) && matchesStatus(emp) && matchesGender(emp),
        getBucketKey: (emp) => emp.phong_ban_id,
      },
      {
        passesOthers: (emp) => matchesDept(emp) && matchesStatus(emp) && matchesGender(emp),
        getBucketKey: (emp) => emp.chuc_vu_id,
      },
      {
        passesOthers: (emp) => matchesDept(emp) && matchesPosition(emp) && matchesGender(emp),
        getBucketKey: (emp) => String(emp.trang_thai),
      },
      {
        passesOthers: (emp) => matchesDept(emp) && matchesPosition(emp) && matchesStatus(emp),
        getBucketKey: (emp) => emp.gioi_tinh,
      },
    ],
  );

  return {
    deptCounts: deptCounts ?? {},
    posCounts: posCounts ?? {},
    statusCounts: statusCounts ?? {},
    genderCounts: genderCounts ?? {},
  };
};

export const getEmployeeStatsAggregates = async (
  params: GetEmployeesParams = {},
): Promise<ApiEmployeeStatsAggregates> => {
  if (isApi()) {
    return apiGetEmployeeStatsAggregates(params);
  }

  const all = await mapEmployeeRows(await repo.getAll());
  const filtered = all.filter((e) => mockMatchesEmployee(e, params));
  const end = params.asAt || params.dateTo ? new Date(params.asAt ?? params.dateTo!) : new Date();
  const thisMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(end.getFullYear(), end.getMonth() - 1, 1);
  const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

  const active = filtered.filter((e) => e.trang_thai === 'Đang làm việc').length;
  const probation = filtered.filter((e) => e.trang_thai === 'Thử việc').length;
  const inactive = filtered.filter(
    (e) => e.trang_thai === 'Nghỉ việc' || e.trang_thai === 'Nghỉ phép',
  ).length;

  const deptMap: Record<string, { id: string | null; count: number }> = {};
  const statusMap: Record<string, number> = {};
  const genderMap: Record<string, number> = {};
  // Key by department id (not name) — match server aggregate shape.
  const summaryMap: Record<
    string,
    { id: string | null; name: string; total: number; active: number; probation: number; inactive: number }
  > = {};

  for (const e of filtered) {
    const deptName = e.ten_phong_ban || 'Chưa phân bổ';
    const deptKey = e.phong_ban_id ?? '__none__';
    if (!deptMap[deptKey]) deptMap[deptKey] = { id: e.phong_ban_id, count: 0 };
    deptMap[deptKey]!.count++;
    statusMap[e.trang_thai] = (statusMap[e.trang_thai] ?? 0) + 1;
    genderMap[e.gioi_tinh] = (genderMap[e.gioi_tinh] ?? 0) + 1;
    if (!summaryMap[deptKey]) {
      summaryMap[deptKey] = {
        id: e.phong_ban_id ?? null,
        name: deptName,
        total: 0,
        active: 0,
        probation: 0,
        inactive: 0,
      };
    }
    const s = summaryMap[deptKey]!;
    s.total++;
    if (e.trang_thai === 'Đang làm việc') s.active++;
    else if (e.trang_thai === 'Thử việc') s.probation++;
    else s.inactive++;
  }

  const months: string[] = [];
  const cursor = new Date(end.getFullYear(), end.getMonth(), 1);
  for (let i = 0; i < 12; i++) {
    months.unshift(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
    );
    cursor.setMonth(cursor.getMonth() - 1);
  }
  const hireCount: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]));
  for (const e of filtered) {
    if (!e.tg_tao) continue;
    const k = e.tg_tao.slice(0, 7);
    if (k in hireCount) hireCount[k] = (hireCount[k] ?? 0) + 1;
  }

  return {
    kpis: {
      total: filtered.length,
      active,
      probation,
      inactive,
      hiredThisMonth: filtered.filter((e) => e.tg_tao?.startsWith(thisMonth)).length,
      hiredPrevMonth: filtered.filter((e) => e.tg_tao?.startsWith(prevMonth)).length,
    },
    byDept: Object.entries(deptMap)
      .map(([, v]) => ({
        id: v.id,
        name:
          filtered.find((e) => (e.phong_ban_id ?? null) === v.id)?.ten_phong_ban ||
          'Chưa phân bổ',
        count: v.count,
      }))
      .sort((a, b) => b.count - a.count),
    byStatus: Object.entries(statusMap).map(([key, count]) => ({ key, count })),
    byGender: Object.entries(genderMap).map(([key, count]) => ({ key, count })),
    hiresByMonth: months.map((month) => ({ month, count: hireCount[month] ?? 0 })),
    deptSummary: Object.values(summaryMap).sort((a, b) => b.total - a.total),
  };
};

export const getEmployeeById = async (id: string): Promise<Employee> => {
  if (isApi()) {
    try {
      return await enrichEmployee(await apiGetEmployee(id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        throw new Error(txt('employee.service.notFound'));
      }
      throw err;
    }
  }
  const row = await repo.getById(id);
  if (!row) throw new Error(txt('employee.service.notFound'));
  return enrichEmployee(row);
};

export const getEmployeeByAuthEmail = async (email: string): Promise<Employee | undefined> => {
  const loginName = authEmailToLoginName(email);
  if (!loginName) return undefined;
  return getEmployeeByLoginName(loginName);
};

export const getEmployeeByLoginName = async (
  loginName: string,
  options?: { excludeEmployeeId?: string },
): Promise<Employee | undefined> => {
  const normalized = normalizeLoginName(loginName);
  if (!normalized) return undefined;

  let employee: Employee | undefined;

  if (isApi()) {
    const row = await apiGetEmployeeByLogin(normalized);
    employee = row ? await enrichEmployee(row) : undefined;
  } else {
    const all = await repo.getAll();
    const rows = await mapEmployeeRows(all);
    employee = rows.find((e) => e.ten_dang_nhap?.toLowerCase() === normalized);
  }

  if (!employee) return undefined;
  if (
    options?.excludeEmployeeId &&
    String(employee.id) === String(options.excludeEmployeeId)
  ) {
    return undefined;
  }
  return employee;
};

export async function assertLoginNameAvailable(
  loginName: string,
  excludeEmployeeId?: string,
): Promise<void> {
  const normalized = normalizeLoginName(loginName);
  if (!normalized) return;
  const existing = await getEmployeeByLoginName(normalized, { excludeEmployeeId });
  if (existing) {
    throw new Error(txt('employee.validation.loginNameDuplicate'));
  }
}

export async function isLoginNameTakenByOtherEmployee(
  loginName: string,
  excludeEmployeeId?: string,
): Promise<boolean> {
  const existing = await getEmployeeByLoginName(loginName, { excludeEmployeeId });
  return Boolean(existing);
}

function stripAuthFieldsFromPayload(
  data: EmployeeFormValues & Partial<{ ten_dang_nhap: string; mat_khau_tam: string }>,
): EmployeeFormValues & { ten_dang_nhap?: string } {
  const { mat_khau_tam: _pw, ten_dang_nhap, ...rest } = data as EmployeeCreateFormValues;
  void _pw;
  return {
    ...rest,
    ...(ten_dang_nhap ? { ten_dang_nhap: normalizeLoginName(ten_dang_nhap) } : {}),
  };
}

export const createEmployee = async (
  data: EmployeeFormValues & Partial<{ ten_dang_nhap: string; mat_khau_tam: string }>,
): Promise<Employee> => {
  const authLoginName = data.ten_dang_nhap ? normalizeLoginName(data.ten_dang_nhap) : '';
  const tempPassword = data.mat_khau_tam;
  const payload = stripAuthFieldsFromPayload(data);

  if (isApi()) {
    if (!authLoginName || !tempPassword) {
      throw new Error(txt('employee.validation.tempPasswordMin'));
    }
    await assertLoginNameAvailable(authLoginName);
    const created = await apiCreateEmployee({
      ho_ten: payload.ho_ten,
      ten_dang_nhap: authLoginName,
      mat_khau_tam: tempPassword,
      email: payload.email,
      email_ca_nhan: payload.email_ca_nhan,
      so_dien_thoai: payload.so_dien_thoai,
      gioi_tinh: payload.gioi_tinh,
      ngay_sinh: payload.ngay_sinh,
      so_cccd: payload.so_cccd,
      ngay_cap_cccd: payload.ngay_cap_cccd,
      noi_cap_cccd: payload.noi_cap_cccd,
      dia_chi_thuong_tru: payload.dia_chi_thuong_tru,
      dia_chi_hien_tai: payload.dia_chi_hien_tai,
      que_quan: payload.que_quan,
      dan_toc: payload.dan_toc,
      ton_giao: payload.ton_giao,
      tinh_trang_hon_nhan: payload.tinh_trang_hon_nhan,
      quoc_tich: payload.quoc_tich,
      ngay_vao_lam: payload.ngay_vao_lam,
      ngay_chinh_thuc: payload.ngay_chinh_thuc,
      ngay_nghi_viec: payload.ngay_nghi_viec,
      ly_do_nghi: payload.ly_do_nghi,
      so_tai_khoan: payload.so_tai_khoan,
      ten_chu_tai_khoan: payload.ten_chu_tai_khoan,
      ngan_hang: payload.ngan_hang,
      chi_nhanh: payload.chi_nhanh,
      nguoi_lien_he_khan: payload.nguoi_lien_he_khan,
      sdt_khan: payload.sdt_khan,
      moi_quan_he: payload.moi_quan_he,
      so_so_bhxh: payload.so_so_bhxh,
      so_bhyt: payload.so_bhyt,
      ma_so_thue_ca_nhan: payload.ma_so_thue_ca_nhan,
      trinh_do: payload.trinh_do,
      chuyen_nganh: payload.chuyen_nganh,
      truong: payload.truong,
      phong_ban_id: payload.phong_ban_id ?? null,
      chuc_vu_id: payload.chuc_vu_id ?? null,
      trang_thai: payload.trang_thai,
      anh_dai_dien: payload.anh_dai_dien || getAvatarUrl(payload.ho_ten ?? ''),
      cap_bac: null,
    });
    return enrichEmployee(created);
  }

  const timestamp = now();
  const creatorId = getCurrentEmployeeId();
  const baseRow = {
    ...payload,
    ho_ten: payload.ho_ten,
    email: payload.email,
    ten_dang_nhap: authLoginName || null,
    so_dien_thoai: payload.so_dien_thoai,
    phong_ban_id: payload.phong_ban_id ?? null,
    chuc_vu_id: payload.chuc_vu_id ?? null,
    gioi_tinh: payload.gioi_tinh,
    trang_thai: payload.trang_thai,
    anh_dai_dien: payload.anh_dai_dien || getAvatarUrl(payload.ho_ten ?? ''),
    tai_khoan_dang_hoat_dong: true,
    must_change_password: false,
    nguoi_tao: creatorId,
    tg_tao: timestamp,
    tg_cap_nhat: timestamp,
  };

  const inserted = await repo.insert(
    { ...baseRow, id: createMockId('EMP') } as Omit<Employee, 'id'> & { id: string },
  );
  let employee = await enrichEmployee(inserted);

  if (authLoginName && tempPassword) {
    await assertLoginNameAvailable(authLoginName);
    const authResult = await provisionEmployeeAuthAccount(employee, authLoginName, tempPassword);
    const patch = {
      must_change_password: authResult.must_change_password ?? true,
      tai_khoan_dang_hoat_dong: authResult.tai_khoan_dang_hoat_dong ?? true,
      ten_dang_nhap: authLoginName,
      tg_cap_nhat: now(),
    };
    await repo.update(employee.id, patch);
    employee = await enrichEmployee({ ...employee, ...patch });
  }

  return employee;
};

export const updateEmployee = async (
  id: string,
  data: EmployeeFormValues & Partial<{ ten_dang_nhap: string; mat_khau_tam: string }>,
): Promise<Employee> => {
  if (isApi()) {
    const before = await getEmployeeById(id);
    const authLoginName = data.ten_dang_nhap ? normalizeLoginName(data.ten_dang_nhap) : '';
    const tempPassword = data.mat_khau_tam?.trim() ?? '';
    if (authLoginName && authLoginName !== (before.ten_dang_nhap ?? '')) {
      await assertLoginNameAvailable(authLoginName, id);
    }
    const updated = await apiUpdateEmployee(id, {
      ho_ten: data.ho_ten,
      ten_dang_nhap: authLoginName || before.ten_dang_nhap,
      mat_khau_tam: tempPassword || undefined,
      email: data.email,
      email_ca_nhan: data.email_ca_nhan,
      so_dien_thoai: data.so_dien_thoai,
      gioi_tinh: data.gioi_tinh,
      ngay_sinh: data.ngay_sinh,
      so_cccd: data.so_cccd,
      ngay_cap_cccd: data.ngay_cap_cccd,
      noi_cap_cccd: data.noi_cap_cccd,
      dia_chi_thuong_tru: data.dia_chi_thuong_tru,
      dia_chi_hien_tai: data.dia_chi_hien_tai,
      que_quan: data.que_quan,
      dan_toc: data.dan_toc,
      ton_giao: data.ton_giao,
      tinh_trang_hon_nhan: data.tinh_trang_hon_nhan,
      quoc_tich: data.quoc_tich,
      ngay_vao_lam: data.ngay_vao_lam,
      ngay_chinh_thuc: data.ngay_chinh_thuc,
      ngay_nghi_viec: data.ngay_nghi_viec,
      ly_do_nghi: data.ly_do_nghi,
      so_tai_khoan: data.so_tai_khoan,
      ten_chu_tai_khoan: data.ten_chu_tai_khoan,
      ngan_hang: data.ngan_hang,
      chi_nhanh: data.chi_nhanh,
      nguoi_lien_he_khan: data.nguoi_lien_he_khan,
      sdt_khan: data.sdt_khan,
      moi_quan_he: data.moi_quan_he,
      so_so_bhxh: data.so_so_bhxh,
      so_bhyt: data.so_bhyt,
      ma_so_thue_ca_nhan: data.ma_so_thue_ca_nhan,
      trinh_do: data.trinh_do,
      chuyen_nganh: data.chuyen_nganh,
      truong: data.truong,
      phong_ban_id: data.phong_ban_id ?? null,
      chuc_vu_id: data.chuc_vu_id ?? null,
      trang_thai: data.trang_thai,
      anh_dai_dien: data.anh_dai_dien,
      cap_bac: before.cap_bac ?? null,
    });
    return enrichEmployee(updated);
  }

  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('employee.service.notFound'));
  const before = await enrichEmployee(existing);

  const authLoginName = data.ten_dang_nhap ? normalizeLoginName(data.ten_dang_nhap) : '';
  const tempPassword = data.mat_khau_tam?.trim() ?? '';
  const oldLogin = before.ten_dang_nhap ? normalizeLoginName(before.ten_dang_nhap) : '';
  const loginChanged = Boolean(oldLogin && authLoginName && authLoginName !== oldLogin);
  const addingAuth = Boolean(!oldLogin && authLoginName && tempPassword);

  const payload = stripAuthFieldsFromPayload(data);
  const updatePatch = {
    ...payload,
    phong_ban_id: payload.phong_ban_id ?? null,
    chuc_vu_id: payload.chuc_vu_id ?? null,
    trang_thai: payload.trang_thai,
    tg_cap_nhat: now(),
  } as Partial<Employee> & Record<string, unknown>;

  if (authLoginName && !loginChanged) {
    updatePatch.ten_dang_nhap = authLoginName;
  }

  const updated = await repo.update(id, updatePatch);
  let employee = await enrichEmployee(updated);

  if (loginChanged && tempPassword) {
    await assertLoginNameAvailable(authLoginName, id);
    await changeEmployeeLoginName(employee, authLoginName, tempPassword);
    const authPatch = {
      ten_dang_nhap: authLoginName,
      must_change_password: true,
      tai_khoan_dang_hoat_dong: true,
      tg_cap_nhat: now(),
    };
    await repo.update(id, authPatch);
    employee = await enrichEmployee({ ...employee, ...authPatch });
  }

  if (addingAuth) {
    await assertLoginNameAvailable(authLoginName, id);
    const authResult = await provisionEmployeeAuthAccount(employee, authLoginName, tempPassword);
    const authPatch = {
      must_change_password: authResult.must_change_password ?? true,
      tai_khoan_dang_hoat_dong: authResult.tai_khoan_dang_hoat_dong ?? true,
      ten_dang_nhap: authLoginName,
      tg_cap_nhat: now(),
    };
    const patched = await repo.update(id, authPatch);
    employee = await enrichEmployee(patched);
  }

  if (before.ten_dang_nhap && !loginChanged) {
    const positionChanged = before.chuc_vu_id !== employee.chuc_vu_id;
    const deptChanged = before.phong_ban_id !== employee.phong_ban_id;
    const statusChanged = before.trang_thai !== employee.trang_thai;
    if (positionChanged || deptChanged || before.ho_ten !== employee.ho_ten) {
      await syncEmployeeAuthMetadata(employee);
    }
    if (statusChanged) {
      if (shouldDisableAuthForStatus(employee.trang_thai)) {
        await setEmployeeAuthActive(employee, false);
      } else if (shouldDisableAuthForStatus(before.trang_thai) && !shouldDisableAuthForStatus(employee.trang_thai)) {
        await setEmployeeAuthActive(employee, true);
      }
    }
  }

  return employee;
};

export const resetEmployeePassword = async (
  id: string,
  newPassword: string,
): Promise<void> => {
  const employee = await getEmployeeById(id);
  if (isApi()) {
    // `must_change_password` phải gửi tường minh: `PATCH /nhan-vien/:id` chỉ hash
    // mật khẩu, không tự bật cờ đổi-lần-đầu (`server/routes/nhan-vien.ts:283`).
    await apiUpdateEmployee(id, { mat_khau_tam: newPassword, must_change_password: true });
    return;
  }
  const result = await resetEmployeeAuthPassword(employee, newPassword);
  await repo.update(id, {
    must_change_password: result.must_change_password ?? true,
    tg_cap_nhat: now(),
  });
};

/**
 * Đặt lại mật khẩu cho nhiều nhân viên — **một mật khẩu tạm dùng chung**.
 *
 * Luôn bật `must_change_password` để mật khẩu dùng chung chỉ tồn tại đến lần đăng
 * nhập kế tiếp của từng người. Chỉ áp cho nhân viên **có tài khoản đăng nhập**;
 * người chưa có `ten_dang_nhap` bị bỏ qua và trả về trong `skipped`.
 */
export const bulkResetEmployeePasswords = async (
  ids: string[],
  newPassword: string,
): Promise<{ updated: number; skipped: string[] }> => {
  const employees = isApi()
    ? await Promise.all((await apiGetEmployeesByIds(ids)).map((raw) => enrichEmployee(raw)))
    : await Promise.all(ids.map((id) => getEmployeeById(id)));
  const eligible = employees.filter((emp) => Boolean(emp.ten_dang_nhap));
  const skipped = employees
    .filter((emp) => !emp.ten_dang_nhap)
    .map((emp) => emp.ho_ten ?? emp.id);

  if (eligible.length === 0) return { updated: 0, skipped };

  if (isApi()) {
    const results = await runInBatchesSettled(
      eligible.map((emp) => emp.id),
      5,
      async (id) => {
        await apiUpdateEmployee(id, {
          mat_khau_tam: newPassword,
          must_change_password: true,
        });
      },
    );
    assertAllBatchSucceeded(results);
    return { updated: eligible.length, skipped };
  }

  const timestamp = now();
  const results = await runInBatchesSettled(
    eligible.map((emp) => emp.id),
    5,
    async (id) => {
      const employee = eligible.find((emp) => emp.id === id)!;
      const result = await resetEmployeeAuthPassword(employee, newPassword);
      await repo.update(id, {
        must_change_password: result.must_change_password ?? true,
        tg_cap_nhat: timestamp,
      });
    },
  );
  assertAllBatchSucceeded(results);
  return { updated: eligible.length, skipped };
};

export const updateEmployeeStatus = async (
  ids: string[],
  status: TrangThaiNhanVien,
): Promise<void> => {
  if (isApi()) {
    await apiUpdateEmployeeStatusBatch(ids, status);
    return;
  }
  const timestamp = now();
  const results = await runInBatchesSettled(ids, 5, async (id) => {
    await repo.update(id, {
      trang_thai: status,
      tg_cap_nhat: timestamp,
    });
    const employee = await getEmployeeById(id);
    if (employee.ten_dang_nhap) {
      if (shouldDisableAuthForStatus(status)) {
        await setEmployeeAuthActive(employee, false);
      } else {
        await setEmployeeAuthActive(employee, true);
      }
    }
  });
  assertAllBatchSucceeded(results);
};

export const bulkUpdateEmployees = async (
  ids: string[],
  fields: Record<string, unknown>,
): Promise<void> => {
  if (isApi()) {
    // `cap_bac` là cột lưu trên var_nhan_vien và server không tự suy từ chuc_vu_id,
    // nên client phải gửi kèm khi bulk edit đổi chức vụ. Tên phòng / tên chức vụ do
    // server join nên không cần denormalize như nhánh mock.
    const patch: Record<string, unknown> = { ...fields };
    if (fields.chuc_vu_id) {
      const positions = await getActivePositions();
      const position = findPositionById(positions, fields.chuc_vu_id as string | number);
      if (!position) throw new Error(txt('employee.validation.positionRequired'));
      patch.cap_bac = position.cap_bac ?? null;
    }
    const apiResults = await runInBatchesSettled(ids, 5, async (id) => {
      await apiUpdateEmployee(id, patch);
    });
    assertAllBatchSucceeded(apiResults);
    return;
  }

  const [positions, depts] = await Promise.all([getActivePositions(), getDepartments()]);
  const timestamp = now();
  const results = await runInBatchesSettled(ids, 5, async (id) => {
    const existing = await repo.getById(id);
    if (!existing) {
      throw new Error(txt('employee.service.notFound'));
    }
    const updated = { ...existing, ...fields, tg_cap_nhat: timestamp };
    if (fields.chuc_vu_id) {
      const position = findPositionById(positions, fields.chuc_vu_id as string | number);
      if (!position) {
        throw new Error(txt('employee.validation.positionRequired'));
      }
      updated.ten_chuc_vu = position?.ten_chuc_vu;
      updated.cap_bac = position?.cap_bac ?? null;
    }
    if (fields.phong_ban_id) {
      updated.ten_phong_ban = depts.find((d) => d.id === fields.phong_ban_id)?.ten_phong_ban;
    }
    await repo.update(id, updated);
  });
  assertAllBatchSucceeded(results);
};

export const deleteEmployee = async (id: string): Promise<void> => {
  if (isApi()) {
    await apiDeleteEmployee(id);
    return;
  }
  await repo.remove([id]);
};

export const deleteEmployees = async (ids: string[]): Promise<void> => {
  if (isApi()) {
    await apiDeleteEmployeesBatch(ids);
    return;
  }
  await repo.remove(ids);
};

function resolveByMaOrId<T extends { id: string; ma?: string | null }>(
  items: T[],
  raw: unknown,
  maKey: keyof T,
): string | null {
  if (raw == null || String(raw).trim() === '') return null;
  const s = String(raw).trim();
  const byId = items.find((item) => item.id === s);
  if (byId) return byId.id;
  const up = s.toUpperCase();
  const byMa = items.find((item) => {
    const ma = item[maKey];
    return typeof ma === 'string' && ma.toUpperCase() === up;
  });
  return byMa?.id ?? null;
}

function parseEmployeeGender(raw: unknown): Gender {
  if (raw == null || String(raw).trim() === '') return 'Nam';
  const s = String(raw).trim();
  if (s === 'Nam' || s === 'Nữ' || s === 'Khác') return s;
  throw new Error(txt('employee.validation.genderInvalid'));
}

function parseEmployeeStatus(raw: unknown): TrangThaiNhanVien {
  if (raw == null || String(raw).trim() === '') return 'Đang làm việc';
  const s = String(raw).trim();
  const found = TRANG_THAI_NHAN_VIEN.find((v) => v === s);
  if (!found) throw new Error(txt('employee.validation.statusInvalid'));
  return found;
}

type ImportEmployeePayload = EmployeeFormValues &
  Partial<{ ten_dang_nhap: string; mat_khau_tam: string }>;

export const importEmployees = async (
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> => {
  const [positions, depts] = await Promise.all([getActivePositions(), getDepartments()]);

  const buildPayload = (row: Record<string, unknown>): ImportEmployeePayload => {
    const ho_ten = String(row.ho_ten ?? '').trim();
    const email = String(row.email ?? '').trim();
    if (!ho_ten || !email) {
      throw new Error(txt('employee.import.missingRequired'));
    }

    const chucVuRaw = row.chuc_vu_id ?? row.ma_chuc_vu;
    const chuc_vu_id = resolveByMaOrId(
      positions.map((p) => ({ ...p, ma: p.ma_chuc_vu })),
      chucVuRaw,
      'ma',
    );
    if (!chuc_vu_id) {
      throw new Error(txt('employee.validation.positionRequired'));
    }

    const position = findPositionById(positions, chuc_vu_id);
    const deptRaw = row.phong_ban_id ?? row.ma_phong_ban;
    const phong_ban_id =
      resolveByMaOrId(
        depts.map((d) => ({ ...d, ma: d.ma_phong_ban })),
        deptRaw,
        'ma',
      ) ??
      position?.phong_ban_id ??
      '';
    if (!phong_ban_id) {
      throw new Error(txt('employee.validation.departmentRequired'));
    }

    const ten_dang_nhap = row.ten_dang_nhap != null ? String(row.ten_dang_nhap).trim() : '';
    const mat_khau_tam = row.mat_khau_tam != null ? String(row.mat_khau_tam) : '';
    if (ten_dang_nhap && !mat_khau_tam.trim()) {
      throw new Error(txt('employee.validation.tempPasswordMin'));
    }

    const payload = {
      ho_ten,
      email,
      so_dien_thoai: String(row.so_dien_thoai ?? '').trim(),
      chuc_vu_id,
      phong_ban_id,
      gioi_tinh: parseEmployeeGender(row.gioi_tinh),
      trang_thai: parseEmployeeStatus(row.trang_thai),
      ...(ten_dang_nhap
        ? { ten_dang_nhap: normalizeLoginName(ten_dang_nhap), mat_khau_tam }
        : {}),
    };

    return ten_dang_nhap
      ? parseForImport(createEmployeeCreateSchema(positions), payload)
      : parseForImport(createEmployeeSchema(positions), payload);
  };

  const postChunk = async (items: ImportEmployeePayload[]): Promise<BulkImportResult> => {
    if (isApi()) {
      return apiImportNhanVien(
        items.map((item) => ({
          ...item,
          anh_dai_dien: item.anh_dai_dien || getAvatarUrl(item.ho_ten ?? ''),
        })),
      );
    }
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createEmployee(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  // Server hash bcrypt ~60–100ms/dòng → chunk 25 để mỗi request không quá lâu.
  return runChunkedImport(rows, buildPayload, postChunk, {
    chunkSize: 25,
    onProgress: options?.onProgress,
  });
};

/**
 * Hoàn tác xóa — **chỉ hỗ trợ ở chế độ mock**.
 *
 * DB không có soft delete: `DELETE /nhan-vien/:id` xóa cứng dòng. Tạo lại bằng
 * `POST /nhan-vien` sẽ sinh **id mới** (mất liên kết hợp đồng / phiếu hành chính),
 * mất `tg_tao` / `nguoi_tao`, và bắt buộc phải có mật khẩu ≥6 ký tự mà snapshot
 * phía client không có. Vì vậy UI không hiển thị nút Hoàn tác ở chế độ API
 * (xem `useDeleteWithUndo`); guard dưới đây chỉ để chặn lời gọi nhầm.
 */
export const restoreEmployees = async (employees: Employee[]): Promise<void> => {
  if (isApi()) {
    throw new Error(txt('employee.service.restoreUnsupported'));
  }
  for (const emp of employees) {
    const {
      ten_phong_ban: _ten_phong_ban,
      ten_chuc_vu: _ten_chuc_vu,
      cap_bac: _cap_bac,
      ...row
    } = emp;
    await repo.insert(row as Omit<Employee, 'id'> & { id: string });
  }
};
