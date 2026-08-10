import { Employee } from '../core/types';
import { type EmployeeFormValues } from '../core/schema';
import { TRANG_THAI_NHAN_VIEN, type TrangThaiNhanVien } from '../core/constants';
import { MOCK_EMPLOYEES } from '@/mocks/he-thong';
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
  resetEmployeeAuthPassword,
  setEmployeeAuthActive,
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
import { matchesSearchTerm } from '@/lib/searchUtils';
import { NHAN_VIEN_SEARCHABLE_KEYS } from '../core/search-keys';
import { employeeMatchesColumnSearch } from '../utils/column-search';
import { employeeSchema, createEmployeeCreateSchema } from '../core/schema';


const mockSeed: Employee[] = MOCK_EMPLOYEES as unknown as Employee[];

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
  const colOk = employeeMatchesColumnSearch(emp, params.columnSearch ?? {});
  return Boolean(searchOk && statusOk && colOk);
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

export type EmployeesListResult = {
  items: Employee[];
  total: number;
};

export type EmployeeFilterCountsResult = {
  statusCounts: Record<string, number>;
};

export const getEmployeeCount = async (params: GetEmployeesParams = {}): Promise<number> => {
  if (isApi()) {
    const { total } = await apiGetEmployeeCount(params);
    return total;
  }
  const all = await repo.getAll();
  return all.filter((e) => mockMatchesEmployee(e, params)).length;
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
    return { items: page.items, total: page.total };
  }

  const all = await repo.getAll();
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
  const all = await repo.getAll();
  const searchTerm = params.search ?? '';
  const baseFilter = (emp: Employee) =>
    matchesSearchTerm(
      emp as unknown as Record<string, unknown>,
      searchTerm,
      NHAN_VIEN_SEARCHABLE_KEYS,
    ) && employeeMatchesColumnSearch(emp, params.columnSearch ?? {});

  const statusCounts: Record<string, number> = {};
  for (const emp of all.filter(baseFilter)) {
    statusCounts[emp.trang_thai] = (statusCounts[emp.trang_thai] ?? 0) + 1;
  }

  return { statusCounts };
};

export const getEmployeeStatsAggregates = async (
  params: GetEmployeesParams = {},
): Promise<ApiEmployeeStatsAggregates> => {
  if (isApi()) {
    return apiGetEmployeeStatsAggregates(params);
  }

  const all = await repo.getAll();
  const filtered = all.filter((e) => mockMatchesEmployee(e, params));

  const active = filtered.filter((e) => e.trang_thai === 'Đang làm việc').length;
  const probation = filtered.filter((e) => e.trang_thai === 'Thử việc').length;
  const inactive = filtered.filter(
    (e) => e.trang_thai === 'Nghỉ việc' || e.trang_thai === 'Nghỉ phép',
  ).length;

  const statusMap: Record<string, number> = {};
  for (const e of filtered) {
    statusMap[e.trang_thai] = (statusMap[e.trang_thai] ?? 0) + 1;
  }

  return {
    kpis: {
      total: filtered.length,
      active,
      probation,
      inactive,
      hiredThisMonth: 0,
      hiredPrevMonth: 0,
    },
    byStatus: Object.entries(statusMap).map(([key, count]) => ({ key, count })),
  };
};

export const getEmployeeById = async (id: string): Promise<Employee> => {
  if (isApi()) {
    try {
      return await apiGetEmployee(id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        throw new Error(txt('employee.service.notFound'));
      }
      throw err;
    }
  }
  const row = await repo.getById(id);
  if (!row) throw new Error(txt('employee.service.notFound'));
  return row;
};

/** Dùng cho pre-login check (theo mã nhân viên) — trả `undefined` khi không tìm thấy. */
export const findEmployeeById = async (id: string): Promise<Employee | undefined> => {
  try {
    return await getEmployeeById(id);
  } catch {
    return undefined;
  }
};

export const createEmployee = async (
  data: EmployeeFormValues & Partial<{ id: string; mat_khau_tam: string }>,
): Promise<Employee> => {
  const tempPassword = data.mat_khau_tam;

  if (isApi()) {
    if (!data.id?.trim()) {
      throw new Error(txt('employee.validation.codeRequired'));
    }
    if (!tempPassword) {
      throw new Error(txt('employee.validation.tempPasswordMin'));
    }
    const created = await apiCreateEmployee({
      id: data.id.trim(),
      ho_ten: data.ho_ten,
      mat_khau_tam: tempPassword,
      trang_thai: data.trang_thai,
      anh_dai_dien: data.anh_dai_dien || getAvatarUrl(data.ho_ten ?? ''),
      ten_dang_nhap: data.ten_dang_nhap || undefined,
    });
    return created;
  }

  const baseRow = {
    ho_ten: data.ho_ten,
    trang_thai: data.trang_thai,
    anh_dai_dien: data.anh_dai_dien || getAvatarUrl(data.ho_ten ?? ''),
    must_change_password: true,
    ten_dang_nhap: data.ten_dang_nhap || undefined,
  };

  const inserted = await repo.insert(
    { ...baseRow, id: data.id?.trim() || createMockId('EMP') } as Omit<Employee, 'id'> & { id: string },
  );
  return inserted;
};

export const updateEmployee = async (
  id: string,
  data: EmployeeFormValues & Partial<{ mat_khau_tam: string }>,
): Promise<Employee> => {
  if (isApi()) {
    const tempPassword = data.mat_khau_tam?.trim() ?? '';
    const updated = await apiUpdateEmployee(id, {
      ho_ten: data.ho_ten,
      mat_khau_tam: tempPassword || undefined,
      trang_thai: data.trang_thai,
      anh_dai_dien: data.anh_dai_dien,
      ten_dang_nhap: data.ten_dang_nhap,
    });
    return updated;
  }

  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('employee.service.notFound'));

  const tempPassword = data.mat_khau_tam?.trim() ?? '';
  const updatePatch: Partial<Employee> & Record<string, unknown> = {
    ho_ten: data.ho_ten,
    trang_thai: data.trang_thai,
    anh_dai_dien: data.anh_dai_dien,
    ten_dang_nhap: data.ten_dang_nhap,
  };

  const updated = await repo.update(id, updatePatch);
  let employee = updated;

  if (tempPassword) {
    const authResult = await resetEmployeeAuthPassword(employee, tempPassword);
    const authPatch = {
      must_change_password: authResult.must_change_password ?? true,
    };
    const patched = await repo.update(id, authPatch);
    employee = patched;
  }

  if (existing.trang_thai !== employee.trang_thai) {
    if (shouldDisableAuthForStatus(employee.trang_thai)) {
      await setEmployeeAuthActive(employee, false);
    } else if (
      shouldDisableAuthForStatus(existing.trang_thai) &&
      !shouldDisableAuthForStatus(employee.trang_thai)
    ) {
      await setEmployeeAuthActive(employee, true);
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
  });
};

/**
 * Đặt lại mật khẩu cho nhiều nhân viên — **một mật khẩu tạm dùng chung**.
 * Luôn bật `must_change_password`.
 */
export const bulkResetEmployeePasswords = async (
  ids: string[],
  newPassword: string,
): Promise<{ updated: number; skipped: string[] }> => {
  const employees = isApi()
    ? await apiGetEmployeesByIds(ids)
    : await Promise.all(ids.map((id) => getEmployeeById(id)));

  if (employees.length === 0) return { updated: 0, skipped: [] };

  if (isApi()) {
    const results = await runInBatchesSettled(
      employees.map((emp) => emp.id),
      5,
      async (id) => {
        await apiUpdateEmployee(id, {
          mat_khau_tam: newPassword,
          must_change_password: true,
        });
      },
    );
    assertAllBatchSucceeded(results);
    return { updated: employees.length, skipped: [] };
  }

  const results = await runInBatchesSettled(
    employees.map((emp) => emp.id),
    5,
    async (id) => {
      const employee = employees.find((emp) => emp.id === id)!;
      const result = await resetEmployeeAuthPassword(employee, newPassword);
      await repo.update(id, {
        must_change_password: result.must_change_password ?? true,
      });
    },
  );
  assertAllBatchSucceeded(results);
  return { updated: employees.length, skipped: [] };
};

export const updateEmployeeStatus = async (
  ids: string[],
  status: TrangThaiNhanVien,
): Promise<void> => {
  if (isApi()) {
    await apiUpdateEmployeeStatusBatch(ids, status);
    return;
  }
  const results = await runInBatchesSettled(ids, 5, async (id) => {
    await repo.update(id, {
      trang_thai: status,
    });
    const employee = await getEmployeeById(id);
    if (shouldDisableAuthForStatus(status)) {
      await setEmployeeAuthActive(employee, false);
    } else {
      await setEmployeeAuthActive(employee, true);
    }
  });
  assertAllBatchSucceeded(results);
};

export const bulkUpdateEmployees = async (
  ids: string[],
  fields: Record<string, unknown>,
): Promise<void> => {
  if (isApi()) {
    const apiResults = await runInBatchesSettled(ids, 5, async (id) => {
      await apiUpdateEmployee(id, fields);
    });
    assertAllBatchSucceeded(apiResults);
    return;
  }

  const results = await runInBatchesSettled(ids, 5, async (id) => {
    const existing = await repo.getById(id);
    if (!existing) {
      throw new Error(txt('employee.service.notFound'));
    }
    const updated = { ...existing, ...fields };
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

function parseEmployeeStatus(raw: unknown): TrangThaiNhanVien {
  if (raw == null || String(raw).trim() === '') return 'Đang làm việc';
  const s = String(raw).trim();
  const found = TRANG_THAI_NHAN_VIEN.find((v) => v === s);
  if (!found) throw new Error(txt('employee.validation.statusInvalid'));
  return found;
}

type ImportEmployeePayload = EmployeeFormValues & Partial<{ mat_khau_tam: string }>;

export const importEmployees = async (
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> => {
  const buildPayload = (row: Record<string, unknown>): ImportEmployeePayload => {
    const ho_ten = String(row.ho_ten ?? '').trim();
    if (!ho_ten) {
      throw new Error(txt('employee.import.missingRequired'));
    }

    const mat_khau_tam = row.mat_khau_tam != null ? String(row.mat_khau_tam) : '';

    const payload = {
      ho_ten,
      trang_thai: parseEmployeeStatus(row.trang_thai),
      ...(mat_khau_tam ? { mat_khau_tam } : {}),
    };

    return mat_khau_tam
      ? parseForImport(createEmployeeCreateSchema(), payload)
      : parseForImport(employeeSchema, payload);
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
 */
export const restoreEmployees = async (employees: Employee[]): Promise<void> => {
  if (isApi()) {
    throw new Error(txt('employee.service.restoreUnsupported'));
  }
  for (const emp of employees) {
    await repo.insert(emp as Omit<Employee, 'id'> & { id: string });
  }
};
