import { apiFetch } from '@/lib/api/client';
import type { PhieuHanhChinh } from '@/features/hanh-chinh/phieu-hanh-chinh/core/types';
import type { PhieuHanhChinhFormValues } from '@/features/hanh-chinh/phieu-hanh-chinh/core/schema';
import type { BulkImportResult } from '@/lib/import';

type ListResult<T> = { items: T[]; total: number };

function pageQs(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  if (params.orderBy) qs.set('orderBy', params.orderBy);
  if (params.ascending != null) qs.set('ascending', String(params.ascending));
  if (params.search) qs.set('search', params.search);
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function apiGetPhieuHanhChinhPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<ListResult<PhieuHanhChinh>> {
  return apiFetch<ListResult<PhieuHanhChinh>>(`/phieu-hanh-chinh${pageQs(params)}`);
}

export async function apiGetPhieuHanhChinhList(): Promise<PhieuHanhChinh[]> {
  const data = await apiGetPhieuHanhChinhPage({
    limit: 5000,
    offset: 0,
    orderBy: 'tg_tao',
    ascending: false,
  });
  return data.items;
}

export async function apiCreatePhieuHanhChinh(
  data: PhieuHanhChinhFormValues,
): Promise<PhieuHanhChinh> {
  return apiFetch<PhieuHanhChinh>('/phieu-hanh-chinh', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportPhieuHanhChinh(
  items: PhieuHanhChinhFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/phieu-hanh-chinh/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdatePhieuHanhChinh(
  id: string,
  data: Partial<PhieuHanhChinhFormValues>,
): Promise<PhieuHanhChinh> {
  return apiFetch<PhieuHanhChinh>(`/phieu-hanh-chinh/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiApprovePhieuQl(
  id: string,
  ghi_chu?: string | null,
): Promise<PhieuHanhChinh> {
  return apiFetch<PhieuHanhChinh>(`/phieu-hanh-chinh/${id}/duyet-ql`, {
    method: 'POST',
    body: JSON.stringify({ ghi_chu: ghi_chu ?? null }),
  });
}

export async function apiApprovePhieuHcns(
  id: string,
  ghi_chu?: string | null,
): Promise<PhieuHanhChinh> {
  return apiFetch<PhieuHanhChinh>(`/phieu-hanh-chinh/${id}/duyet-hcns`, {
    method: 'POST',
    body: JSON.stringify({ ghi_chu: ghi_chu ?? null }),
  });
}

export async function apiRejectPhieuHanhChinh(
  id: string,
  ly_do_tu_choi: string,
): Promise<PhieuHanhChinh> {
  return apiFetch<PhieuHanhChinh>(`/phieu-hanh-chinh/${id}/tu-choi`, {
    method: 'POST',
    body: JSON.stringify({ ly_do_tu_choi }),
  });
}

export async function apiCancelPhieuHanhChinh(id: string): Promise<PhieuHanhChinh> {
  return apiFetch<PhieuHanhChinh>(`/phieu-hanh-chinh/${id}/huy`, { method: 'POST' });
}

export async function apiDeletePhieuHanhChinh(id: string): Promise<void> {
  await apiFetch(`/phieu-hanh-chinh/${id}`, { method: 'DELETE' });
}

export type AdminFormStatsQueryParams = {
  ma_phieu?: string[];
  trang_thai?: string[];
  id_phong_ban?: string[];
  id_nhan_vien?: string[];
  from?: string;
  to?: string;
};

function adminFormStatsQs(
  params?: AdminFormStatsQueryParams & {
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
    search?: string;
  },
): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  if (params.orderBy) qs.set('orderBy', params.orderBy);
  if (params.ascending != null) qs.set('ascending', String(params.ascending));
  if (params.search) qs.set('search', params.search);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.ma_phieu?.length) {
    qs.set('ma_phieu', params.ma_phieu.join(','));
  }
  if (params.trang_thai?.length) qs.set('trang_thai', params.trang_thai.join(','));
  if (params.id_phong_ban?.length) {
    qs.set('id_phong_ban', params.id_phong_ban.join(','));
  }
  if (params.id_nhan_vien?.length) {
    qs.set('id_nhan_vien', params.id_nhan_vien.join(','));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export type ApiAdminFormStatsAggregates = {
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
};

export async function apiGetAdminFormStatsAggregates(
  params?: AdminFormStatsQueryParams,
): Promise<ApiAdminFormStatsAggregates> {
  return apiFetch(`/phieu-hanh-chinh/stats/aggregates${adminFormStatsQs(params)}`);
}

export async function apiGetPhieuHanhChinhPageFiltered(
  params?: AdminFormStatsQueryParams & {
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  },
): Promise<ListResult<PhieuHanhChinh>> {
  return apiFetch<ListResult<PhieuHanhChinh>>(
    `/phieu-hanh-chinh${adminFormStatsQs(params)}`,
  );
}
