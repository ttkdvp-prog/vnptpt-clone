import type { LoaiTaiLieu } from '@/features/hanh-chinh/thiet-lap-tai-lieu/loai-tai-lieu/core/types';
import type { LoaiTaiLieuFormValues } from '@/features/hanh-chinh/thiet-lap-tai-lieu/loai-tai-lieu/core/schema';
import type { DanhSachTaiLieu } from '@/features/hanh-chinh/danh-sach-tai-lieu/core/types';
import type { DanhSachTaiLieuFormValues } from '@/features/hanh-chinh/danh-sach-tai-lieu/core/schema';
import { apiFetch } from '@/lib/api/client';
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

export async function apiGetLoaiTaiLieuPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<ListResult<LoaiTaiLieu>> {
  return apiFetch<ListResult<LoaiTaiLieu>>(`/loai-tai-lieu${pageQs(params)}`);
}

export async function apiGetLoaiTaiLieuList(): Promise<LoaiTaiLieu[]> {
  const data = await apiGetLoaiTaiLieuPage({ limit: 5000, offset: 0, orderBy: 'thu_tu' });
  return data.items;
}

export async function apiCreateLoaiTaiLieu(
  data: LoaiTaiLieuFormValues,
): Promise<LoaiTaiLieu> {
  return apiFetch<LoaiTaiLieu>('/loai-tai-lieu', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportLoaiTaiLieu(
  items: LoaiTaiLieuFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/loai-tai-lieu/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateLoaiTaiLieu(
  id: string,
  data: Partial<LoaiTaiLieuFormValues>,
): Promise<LoaiTaiLieu> {
  return apiFetch<LoaiTaiLieu>(`/loai-tai-lieu/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteLoaiTaiLieu(id: string): Promise<void> {
  await apiFetch(`/loai-tai-lieu/${id}`, { method: 'DELETE' });
}

export type DocumentStatsQueryParams = {
  id_loai_tai_lieu?: string[];
  trang_thai?: string[];
  nguoi_tao?: string[];
  from?: string;
  to?: string;
};

function documentStatsQs(
  params?: DocumentStatsQueryParams & {
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
  if (params.id_loai_tai_lieu?.length) {
    qs.set('id_loai_tai_lieu', params.id_loai_tai_lieu.join(','));
  }
  if (params.trang_thai?.length) qs.set('trang_thai', params.trang_thai.join(','));
  if (params.nguoi_tao?.length) qs.set('nguoi_tao', params.nguoi_tao.join(','));
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function apiGetDanhSachTaiLieuPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  id_loai_tai_lieu?: string[];
  trang_thai?: string[];
  nguoi_tao?: string[];
  from?: string;
  to?: string;
}): Promise<ListResult<DanhSachTaiLieu>> {
  return apiFetch<ListResult<DanhSachTaiLieu>>(
    `/danh-sach-tai-lieu${documentStatsQs(params)}`,
  );
}

export type ApiDocumentStatsAggregates = {
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
};

export async function apiGetDocumentStatsAggregates(
  params?: DocumentStatsQueryParams,
): Promise<ApiDocumentStatsAggregates> {
  return apiFetch(`/danh-sach-tai-lieu/stats/aggregates${documentStatsQs(params)}`);
}

export async function apiGetDanhSachTaiLieuList(): Promise<DanhSachTaiLieu[]> {
  const data = await apiGetDanhSachTaiLieuPage({
    limit: 5000,
    offset: 0,
    orderBy: 'tg_cap_nhat',
    ascending: false,
  });
  return data.items;
}

export async function apiCreateDanhSachTaiLieu(
  data: DanhSachTaiLieuFormValues,
): Promise<DanhSachTaiLieu> {
  return apiFetch<DanhSachTaiLieu>('/danh-sach-tai-lieu', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportDanhSachTaiLieu(
  items: DanhSachTaiLieuFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/danh-sach-tai-lieu/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateDanhSachTaiLieu(
  id: string,
  data: Partial<DanhSachTaiLieuFormValues>,
): Promise<DanhSachTaiLieu> {
  return apiFetch<DanhSachTaiLieu>(`/danh-sach-tai-lieu/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteDanhSachTaiLieu(id: string): Promise<void> {
  await apiFetch(`/danh-sach-tai-lieu/${id}`, { method: 'DELETE' });
}
