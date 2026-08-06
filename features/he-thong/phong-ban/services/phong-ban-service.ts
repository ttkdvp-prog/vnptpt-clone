import { Department } from '../core/types';
import { departmentSchema, DepartmentFormValues } from '../core/schema';
import { MOCK_DEPARTMENTS } from '@/mocks/he-thong';
import { createRepository } from '@/lib/data/create-repository';
import { createMockId } from '@/lib/data/mock-id';
import { isApi } from '@/lib/data/config';
import {
  apiCreateDepartment,
  apiDeleteDepartment,
  apiDeleteDepartmentsBatch,
  apiGetDepartments,
  apiGetDepartmentsPage,
  apiImportPhongBan,
  apiUpdateDepartment,
  apiUpdateDepartmentStatusBatch,
} from '@/lib/api/he-thong';
import type { TrangThaiHoatDong } from '@/lib/constants/trang-thai';
import { txt } from '@/lib/text';
import { DEPARTMENTS_LIST_QUERY_PARAMS } from '@/lib/query-keys';
import {
  parseForImport,
  runChunkedImport,
  type BulkImportResult,
  type ImportBatchRow,
  type ImportResult,
} from '@/lib/import';
import {
  getDepartmentParentValidationMessage,
  validateDepartmentParentChange,
} from '../utils/department-hierarchy';
import { getCurrentEmployeeId } from '@/lib/current-session-employee';
import { assertAllBatchSucceeded, runInBatchesSettled } from '@/lib/async-utils';

const repo = createRepository<Department>({
  tableName: 'var_phong_ban',
  mockData: MOCK_DEPARTMENTS,
  delay: 600,
});

/**
 * Cache ngắn hạn cho `apiGetDepartments()` (toàn bộ danh sách, dùng để enrich tên phòng
 * ban/bộ phận ở nhiều nơi — nhân viên, chức vụ...). Không dùng React Query vì các service
 * này chạy ngoài component. Mục đích: khi N lệnh gọi (vd N nhân viên trong 1 bulk action)
 * cùng cần `getDepartments()` trong cùng khoảng ngắn, chỉ 1 request thật được gửi đi —
 * các lệnh gọi còn lại dùng lại promise/kết quả đã cache, tránh N request trùng lặp.
 */
let departmentsCache: { promise: Promise<Department[]>; expiresAt: number } | null = null;
const DEPARTMENTS_CACHE_TTL_MS = 30_000;

function getCachedApiDepartments(): Promise<Department[]> {
  const now = Date.now();
  if (departmentsCache && departmentsCache.expiresAt > now) {
    return departmentsCache.promise;
  }
  const promise = apiGetDepartments();
  promise.catch(() => { departmentsCache = null; });
  departmentsCache = { promise, expiresAt: now + DEPARTMENTS_CACHE_TTL_MS };
  return promise;
}

/** Xóa cache sau khi ghi dữ liệu phòng ban (create/update/delete/import) để không đọc dữ liệu cũ. */
function invalidateDepartmentsCache(): void {
  departmentsCache = null;
}

async function departmentHasChildren(deptId: string): Promise<boolean> {
  if (isApi()) {
    const list = await getCachedApiDepartments();
    return list.some((d) => d.cha_id === deptId);
  }
  const list = await repo.getAll({ orderBy: 'duong_dan', ascending: true });
  return list.some((d) => d.cha_id === deptId);
}

async function buildPathAndLevel(
  id: string,
  chaId: string | null,
): Promise<{ duong_dan: string; cap_do: number }> {
  if (!chaId) {
    return { duong_dan: `/${id}`, cap_do: 1 };
  }
  const parent = await repo.getById(chaId);
  if (!parent) {
    return { duong_dan: `/${id}`, cap_do: 1 };
  }
  return {
    duong_dan: `${parent.duong_dan}/${id}`,
    cap_do: parent.cap_do + 1,
  };
}

/** Mock path: giữ validateDepartmentParentChange với full list (dev only). */
async function assertValidDepartmentParentMock(
  dept: Department | null,
  chaId: string | null | undefined,
): Promise<void> {
  const all = await repo.getAll();
  const error = validateDepartmentParentChange(dept, chaId, all);
  if (error) {
    throw new Error(getDepartmentParentValidationMessage(error));
  }
}

export type GetDepartmentsParams = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
};

export type DepartmentsListResult = {
  items: Department[];
  total: number;
};

export const getDepartmentCount = async (): Promise<number> => {
  if (isApi()) {
    const { total } = await apiGetDepartmentsPage({ limit: 1, offset: 0 });
    return total;
  }
  return repo.count();
};

export const getDepartmentsPage = async (
  params: GetDepartmentsParams = {},
): Promise<DepartmentsListResult> => {
  if (isApi()) {
    return apiGetDepartmentsPage({
      limit: params.limit ?? DEPARTMENTS_LIST_QUERY_PARAMS.limit,
      offset: params.offset ?? DEPARTMENTS_LIST_QUERY_PARAMS.offset,
      orderBy: params.orderBy ?? DEPARTMENTS_LIST_QUERY_PARAMS.orderBy,
      ascending: params.ascending ?? DEPARTMENTS_LIST_QUERY_PARAMS.ascending,
    });
  }
  const limit = params.limit ?? DEPARTMENTS_LIST_QUERY_PARAMS.limit;
  const offset = params.offset ?? DEPARTMENTS_LIST_QUERY_PARAMS.offset;
  const orderBy = params.orderBy ?? DEPARTMENTS_LIST_QUERY_PARAMS.orderBy;
  const ascending = params.ascending ?? DEPARTMENTS_LIST_QUERY_PARAMS.ascending;
  const { items } = await repo.getPage({
    limit,
    offset,
    orderBy,
    ascending,
    includeTotal: false,
  });
  return { items, total: 0 };
};

export const getDepartments = async (params: GetDepartmentsParams = {}): Promise<Department[]> => {
  if (isApi()) {
    return getCachedApiDepartments();
  }
  const { items } = await getDepartmentsPage(params);
  return items;
};

export const createDepartment = async (data: DepartmentFormValues): Promise<Department> => {
  const chaId = data.cha_id === '' || data.cha_id == null ? null : data.cha_id;
  if (isApi()) {
    const all = await getCachedApiDepartments();
    const error = validateDepartmentParentChange(null, chaId, all);
    if (error) throw new Error(getDepartmentParentValidationMessage(error));
    const created = await apiCreateDepartment({ ...data, cha_id: chaId });
    invalidateDepartmentsCache();
    return created;
  }
  await assertValidDepartmentParentMock(null, chaId);

  const now = new Date().toISOString();
  const thuTu = data.thu_tu ?? 1;
  const id = createMockId('dep');
  const { duong_dan, cap_do } = await buildPathAndLevel(id, chaId);
  const creatorId = getCurrentEmployeeId();
  return repo.insert({
    id,
    ma_phong_ban: data.ma_phong_ban,
    ten_phong_ban: data.ten_phong_ban,
    mo_ta: data.mo_ta,
    cha_id: chaId,
    trang_thai: data.trang_thai,
    thu_tu: thuTu,
    duong_dan,
    cap_do,
    nguoi_tao: creatorId,
    tg_tao: now,
    tg_cap_nhat: now,
  } as Omit<Department, 'id'> & { id: string });
};

export const updateDepartment = async (id: string, data: DepartmentFormValues): Promise<Department> => {
  if (isApi()) {
    const all = await getCachedApiDepartments();
    const existing = all.find((d) => d.id === id);
    if (!existing) throw new Error(txt('department.service.notFound'));
    const chaId = data.cha_id === '' || data.cha_id == null ? null : data.cha_id;
    const error = validateDepartmentParentChange(existing, chaId, all);
    if (error) throw new Error(getDepartmentParentValidationMessage(error));
    const updated = await apiUpdateDepartment(id, { ...data, cha_id: chaId });
    invalidateDepartmentsCache();
    return updated;
  }

  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('department.service.notFound'));

  const chaId = data.cha_id === '' || data.cha_id == null ? null : data.cha_id;
  await assertValidDepartmentParentMock(existing, chaId);

  let { duong_dan, cap_do } = await buildPathAndLevel(id, chaId);
  if (chaId === existing.cha_id) {
    duong_dan = existing.duong_dan;
    cap_do = existing.cap_do;
  }

  return repo.update(id, {
    ...data,
    cha_id: chaId,
    trang_thai: data.trang_thai,
    duong_dan,
    cap_do,
    tg_cap_nhat: new Date().toISOString(),
  });
};

export const updateDepartmentStatus = async (id: string, status: TrangThaiHoatDong): Promise<Department> => {
  if (isApi()) {
    const updated = await apiUpdateDepartment(id, { trang_thai: status });
    invalidateDepartmentsCache();
    return updated;
  }
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('department.service.notFound'));
  return repo.update(id, { trang_thai: status, tg_cap_nhat: new Date().toISOString() });
};

export const deleteDepartment = async (id: string): Promise<void> => {
  if (await departmentHasChildren(id)) {
    throw new Error(txt('department.service.hasChildren'));
  }
  if (isApi()) {
    await apiDeleteDepartment(id);
    invalidateDepartmentsCache();
    return;
  }
  await repo.remove([id]);
};

/**
 * Đổi trạng thái nhiều phòng ban trong 1 lệnh (bulk) — bổ sung song song với
 * `updateDepartmentStatus` (single id) đã có, không đổi hàm cũ, chỉ thêm mới.
 */
export const updateDepartmentStatusMany = async (
  ids: string[],
  status: TrangThaiHoatDong,
): Promise<Department[]> => {
  if (isApi()) {
    const items = await apiUpdateDepartmentStatusBatch(ids, status);
    invalidateDepartmentsCache();
    return items;
  }
  const timestamp = new Date().toISOString();
  const results = await runInBatchesSettled(ids, 5, (id) =>
    repo.update(id, { trang_thai: status, tg_cap_nhat: timestamp }),
  );
  assertAllBatchSucceeded(results);
  return results.map((r) => (r.ok ? r.value : null)).filter((v): v is Department => v != null);
};

/**
 * Xóa nhiều phòng ban trong 1 lệnh (bulk) — bổ sung song song với `deleteDepartment`
 * (single id) đã có. Phòng ban còn phòng con sẽ bị bỏ qua (không throw cả batch).
 */
export const deleteDepartmentsMany = async (ids: string[]): Promise<{ deletedIds: string[]; skippedIds: string[] }> => {
  if (isApi()) {
    const { skippedIds } = await apiDeleteDepartmentsBatch(ids);
    invalidateDepartmentsCache();
    const skipped = skippedIds.map(String);
    return { deletedIds: ids.filter((id) => !skipped.includes(id)), skippedIds: skipped };
  }
  const deletable: string[] = [];
  const skipped: string[] = [];
  for (const id of ids) {
    if (await departmentHasChildren(id)) skipped.push(id);
    else deletable.push(id);
  }
  if (deletable.length > 0) await repo.remove(deletable);
  return { deletedIds: deletable, skippedIds: skipped };
};

/** Import nhiều phòng ban (chỉ thêm mới, cha_id = null hoặc id có sẵn) */
export const importDepartments = async (
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> => {
  const depts = await getDepartments();
  const deptIds = new Set(depts.map((d) => d.id));

  const buildPayload = (row: Record<string, unknown>): DepartmentFormValues => {
    const data = parseForImport(departmentSchema, row);
    const idCha = data.cha_id === '' || data.cha_id == null ? null : data.cha_id;
    if (idCha && !deptIds.has(idCha)) {
      throw new Error('Phòng cha không tồn tại');
    }
    return { ...data, cha_id: idCha };
  };

  const postChunk = async (items: DepartmentFormValues[]): Promise<BulkImportResult> => {
    if (isApi()) {
      const result = await apiImportPhongBan(items);
      invalidateDepartmentsCache();
      return result;
    }
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createDepartment(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildPayload, postChunk, options);
};
