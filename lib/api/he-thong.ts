import { apiFetch, apiFetchBlob } from '@/lib/api/client';
import type { BulkImportResult } from '@/lib/import';
import type { Department } from '@/features/he-thong/phong-ban/core/types';
import type { DepartmentFormValues } from '@/features/he-thong/phong-ban/core/schema';
import type { Position } from '@/features/he-thong/chuc-vu/core/types';
import type { PositionFormValues } from '@/features/he-thong/chuc-vu/core/schema';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import type { User } from '@/types';

interface ListResult<T> {
  items: T[];
  total: number;
}

export interface ApiLoginResult {
  token: string;
  user: User & { cap_bac?: number | null };
  employee: Employee;
  mustChangePassword: boolean;
}

export async function apiLogin(taiKhoan: string, password: string): Promise<ApiLoginResult> {
  return apiFetch<ApiLoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ tai_khoan: taiKhoan, password }),
  });
}

export async function apiLogout(): Promise<void> {
  await apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' });
}

export async function apiMe(): Promise<{ user: User & { cap_bac?: number | null }; employee: Employee }> {
  return apiFetch('/auth/me');
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiFetch<{ ok: boolean }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function apiSetPassword(newPassword: string): Promise<void> {
  await apiFetch<{ ok: boolean }>('/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ new_password: newPassword }),
  });
}

export async function apiGetDepartments(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<Department[]> {
  const data = await apiGetDepartmentsPage(params ?? { limit: 5000, offset: 0 });
  return data.items;
}

export async function apiGetDepartmentsPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<ListResult<Department>> {
  const searchParams = new URLSearchParams();
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  if (params?.offset != null) searchParams.set('offset', String(params.offset));
  if (params?.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params?.ascending != null) searchParams.set('ascending', String(params.ascending));
  if (params?.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();
  return apiFetch<ListResult<Department>>(`/phong-ban${qs ? `?${qs}` : ''}`);
}

export async function apiGetDepartment(id: string): Promise<Department> {
  return apiFetch<Department>(`/phong-ban/${id}`);
}

export async function apiUpdateDepartmentStatusBatch(
  ids: string[],
  trang_thai: string,
): Promise<Department[]> {
  const data = await apiFetch<{ items: Department[] }>('/phong-ban/status/bulk', {
    method: 'PATCH',
    body: JSON.stringify({ ids, trang_thai }),
  });
  return data.items;
}

export async function apiDeleteDepartmentsBatch(
  ids: string[],
): Promise<{ deletedCount: number; skippedIds: number[] }> {
  return apiFetch('/phong-ban/bulk', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}

export async function apiCreateDepartment(data: DepartmentFormValues): Promise<Department> {
  return apiFetch<Department>('/phong-ban', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportPhongBan(
  items: DepartmentFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/phong-ban/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateDepartment(
  id: string,
  data: Partial<DepartmentFormValues> & { trang_thai?: string },
): Promise<Department> {
  return apiFetch<Department>(`/phong-ban/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteDepartment(id: string): Promise<void> {
  await apiFetch(`/phong-ban/${id}`, { method: 'DELETE' });
}

export async function apiGetPositions(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  activeOnly?: boolean;
}): Promise<Position[]> {
  const data = await apiGetPositionsPage(params ?? { limit: 5000, offset: 0 });
  return data.items;
}

export async function apiGetPositionsPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  activeOnly?: boolean;
}): Promise<ListResult<Position>> {
  const searchParams = new URLSearchParams();
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  if (params?.offset != null) searchParams.set('offset', String(params.offset));
  if (params?.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params?.ascending != null) searchParams.set('ascending', String(params.ascending));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.activeOnly) searchParams.set('activeOnly', 'true');
  const qs = searchParams.toString();
  return apiFetch<ListResult<Position>>(`/chuc-vu${qs ? `?${qs}` : ''}`);
}

export async function apiUpdatePositionStatus(
  ids: string[],
  trang_thai: string,
): Promise<Position[]> {
  const data = await apiFetch<ListResult<Position>>('/chuc-vu/status/bulk', {
    method: 'PATCH',
    body: JSON.stringify({ ids, trang_thai }),
  });
  return data.items;
}

export async function apiGetPosition(id: string): Promise<Position> {
  return apiFetch<Position>(`/chuc-vu/${id}`);
}

export async function apiCreatePosition(data: PositionFormValues): Promise<Position> {
  return apiFetch<Position>('/chuc-vu', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportChucVu(
  items: PositionFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/chuc-vu/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdatePosition(
  id: string,
  data: Partial<PositionFormValues>,
): Promise<Position> {
  return apiFetch<Position>(`/chuc-vu/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeletePosition(id: string): Promise<void> {
  await apiFetch(`/chuc-vu/${id}`, { method: 'DELETE' });
}

export type ApiEmployeeListParams = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  trang_thai?: string[];
  phong_ban_id?: string[];
  chuc_vu_id?: string[];
  gioi_tinh?: string[];
  columnSearch?: Record<string, string>;
  asAt?: string;
  dateFrom?: string;
  dateTo?: string;
};

function appendEmployeeListParams(
  searchParams: URLSearchParams,
  params?: ApiEmployeeListParams,
): void {
  if (!params) return;
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.offset != null) searchParams.set('offset', String(params.offset));
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.ascending != null) searchParams.set('ascending', String(params.ascending));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.trang_thai?.length) searchParams.set('trang_thai', params.trang_thai.join(','));
  if (params.phong_ban_id?.length) searchParams.set('phong_ban_id', params.phong_ban_id.join(','));
  if (params.chuc_vu_id?.length) searchParams.set('chuc_vu_id', params.chuc_vu_id.join(','));
  if (params.gioi_tinh?.length) searchParams.set('gioi_tinh', params.gioi_tinh.join(','));
  if (params.columnSearch && Object.keys(params.columnSearch).length > 0) {
    searchParams.set('columnSearch', JSON.stringify(params.columnSearch));
  }
  if (params.asAt) searchParams.set('asAt', params.asAt);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);
}

export async function apiGetEmployees(params?: ApiEmployeeListParams): Promise<Employee[]> {
  const data = await apiGetEmployeesPage(params);
  return data.items;
}

export async function apiGetEmployeesPage(
  params?: ApiEmployeeListParams,
): Promise<ListResult<Employee>> {
  const searchParams = new URLSearchParams();
  appendEmployeeListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch<ListResult<Employee>>(`/nhan-vien${qs ? `?${qs}` : ''}`);
}

export async function apiGetEmployeeCount(
  params?: Omit<ApiEmployeeListParams, 'limit' | 'offset' | 'orderBy' | 'ascending'>,
): Promise<{ total: number }> {
  const searchParams = new URLSearchParams();
  appendEmployeeListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch<{ total: number }>(`/nhan-vien/count${qs ? `?${qs}` : ''}`);
}

export async function apiGetEmployeeFilterCounts(
  params?: Omit<ApiEmployeeListParams, 'limit' | 'offset' | 'orderBy' | 'ascending'>,
): Promise<{
  deptCounts: Record<string, number>;
  posCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  genderCounts: Record<string, number>;
}> {
  const searchParams = new URLSearchParams();
  appendEmployeeListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch(`/nhan-vien/filter-counts${qs ? `?${qs}` : ''}`);
}

export type ApiEmployeeStatsAggregates = {
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
    /** Department id, null = "Chưa phân bổ" (không drill-down được) */
    id: string | null;
    name: string;
    total: number;
    active: number;
    probation: number;
    inactive: number;
  }>;
};

export async function apiGetEmployeeStatsAggregates(
  params?: Omit<ApiEmployeeListParams, 'limit' | 'offset' | 'orderBy' | 'ascending'>,
): Promise<ApiEmployeeStatsAggregates> {
  const searchParams = new URLSearchParams();
  appendEmployeeListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch(`/nhan-vien/stats/aggregates${qs ? `?${qs}` : ''}`);
}

export async function apiGetEmployee(id: string): Promise<Employee> {
  return apiFetch<Employee>(`/nhan-vien/${id}`);
}

/** Lấy nhiều nhân viên theo ids trong 1 request — tránh N request `GET /:id` lặp lại. */
export async function apiGetEmployeesByIds(ids: string[]): Promise<Employee[]> {
  if (ids.length === 0) return [];
  const data = await apiFetch<{ items: Employee[] }>(
    `/nhan-vien/by-ids?ids=${ids.map(encodeURIComponent).join(',')}`,
  );
  return data.items;
}

export async function apiUpdateEmployeeStatusBatch(
  ids: string[],
  trang_thai: string,
): Promise<Employee[]> {
  const data = await apiFetch<{ items: Employee[] }>('/nhan-vien/status/bulk', {
    method: 'PATCH',
    body: JSON.stringify({ ids, trang_thai }),
  });
  return data.items;
}

export async function apiDeleteEmployeesBatch(ids: string[]): Promise<void> {
  await apiFetch('/nhan-vien/bulk', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}

/** Hồ sơ nhân sự dạng PDF — render bằng Chromium ở server (chữ thật, không phải ảnh). */
export async function apiGetEmployeeProfilePdf(
  id: string,
): Promise<{ blob: Blob; filename?: string }> {
  return apiFetchBlob(`/nhan-vien/${encodeURIComponent(id)}/ho-so.pdf`);
}

/** Hồ sơ nhân sự dạng .docx thật (OOXML) — sinh ở server. */
export async function apiGetEmployeeProfileDocx(
  id: string,
): Promise<{ blob: Blob; filename?: string }> {
  return apiFetchBlob(`/nhan-vien/${encodeURIComponent(id)}/ho-so.docx`);
}

export async function apiGetEmployeeByLogin(taiKhoan: string): Promise<Employee | null> {
  try {
    return await apiFetch<Employee>(`/nhan-vien/by-login/${encodeURIComponent(taiKhoan)}`);
  } catch (err) {
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
      return null;
    }
    throw err;
  }
}

export async function apiCreateEmployee(data: Record<string, unknown>): Promise<Employee> {
  return apiFetch<Employee>('/nhan-vien', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportNhanVien(
  items: Record<string, unknown>[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/nhan-vien/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateEmployee(
  id: string,
  data: Record<string, unknown>,
): Promise<Employee> {
  return apiFetch<Employee>(`/nhan-vien/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteEmployee(id: string): Promise<void> {
  await apiFetch(`/nhan-vien/${id}`, { method: 'DELETE' });
}

export async function apiGetCompany(): Promise<{
  id: number;
  ten_ung_dung: string;
  mo_ta_ung_dung: string | null;
  logo: string | null;
  ten_cong_ty: string;
  ma_so_thue: string;
  dia_chi: string | null;
  so_dien_thoai: string | null;
  email: string | null;
  website: string | null;
  nguoi_dai_dien: string | null;
  chuc_vu_nguoi_dai_dien: string | null;
  dia_diem_ky: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}> {
  return apiFetch('/cong-ty');
}

export async function apiGetCompanyBranding(): Promise<{
  appName: string;
  appDescription: string;
  appLogo: string | null;
}> {
  return apiFetch('/cong-ty/branding');
}

export async function apiUpsertCompany(
  data: Record<string, unknown>,
): Promise<{
  id: number;
  ten_ung_dung: string;
  mo_ta_ung_dung: string | null;
  logo: string | null;
  ten_cong_ty: string;
  ma_so_thue: string;
  dia_chi: string | null;
  so_dien_thoai: string | null;
  email: string | null;
  website: string | null;
  nguoi_dai_dien: string | null;
  chuc_vu_nguoi_dai_dien: string | null;
  dia_diem_ky: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
}> {
  return apiFetch('/cong-ty', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiGetPhanQuyen(params: {
  moduleKey?: string;
  chucVuIds?: string[];
}): Promise<
  Array<{
    id: string;
    module_key: string;
    chuc_vu_id: string;
    quyen: string;
    tg_tao: string;
    tg_cap_nhat: string;
  }>
> {
  const q = new URLSearchParams();
  if (params.moduleKey) q.set('module_key', params.moduleKey);
  if (params.chucVuIds?.length) q.set('chuc_vu_ids', params.chucVuIds.join(','));
  const qs = q.toString();
  const data = await apiFetch<ListResult<{
    id: string;
    module_key: string;
    chuc_vu_id: string;
    quyen: string;
    tg_tao: string;
    tg_cap_nhat: string;
  }>>(`/phan-quyen${qs ? `?${qs}` : ''}`);
  return data.items;
}

export async function apiPutPhanQuyen(payload: {
  module_key: string;
  rows: Array<{ chuc_vu_id: string | number; quyen: string }>;
}): Promise<void> {
  await apiFetch('/phan-quyen', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
