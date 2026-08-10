import { apiFetch } from '@/lib/api/client';
import type { TaiLieu } from '@/features/cong-viec/tai-lieu/core/types';
import type { CongViec } from '@/features/cong-viec/danh-sach-cong-viec/core/types';

interface ListResult<T> {
  items: T[];
  total: number;
}

export type ApiTaiLieuListParams = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  tinh_trang?: string[];
  danh_muc?: string[];
  to?: string[];
};

function appendListParams(searchParams: URLSearchParams, params?: ApiTaiLieuListParams): void {
  if (!params) return;
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.offset != null) searchParams.set('offset', String(params.offset));
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.ascending != null) searchParams.set('ascending', String(params.ascending));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.tinh_trang?.length) searchParams.set('tinh_trang', params.tinh_trang.join(','));
  if (params.danh_muc?.length) searchParams.set('danh_muc', params.danh_muc.join(','));
  if (params.to?.length) searchParams.set('to', params.to.join(','));
}

export async function apiGetTaiLieuPage(params?: ApiTaiLieuListParams): Promise<ListResult<TaiLieu>> {
  const searchParams = new URLSearchParams();
  appendListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch<ListResult<TaiLieu>>(`/tai-lieu${qs ? `?${qs}` : ''}`);
}

export async function apiGetTaiLieuCount(
  params?: Omit<ApiTaiLieuListParams, 'limit' | 'offset' | 'orderBy' | 'ascending'>,
): Promise<{ total: number }> {
  const searchParams = new URLSearchParams();
  appendListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch<{ total: number }>(`/tai-lieu/count${qs ? `?${qs}` : ''}`);
}

export async function apiGetTaiLieuFilterCounts(
  params?: Omit<ApiTaiLieuListParams, 'limit' | 'offset' | 'orderBy' | 'ascending'>,
): Promise<{ tinhTrangCounts: Record<string, number>; danhMucCounts: Record<string, number> }> {
  const searchParams = new URLSearchParams();
  appendListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch(`/tai-lieu/filter-counts${qs ? `?${qs}` : ''}`);
}

export type ApiTaiLieuStatsAggregates = {
  kpis: { total: number; dangHieuLuc: number; hetHieuLuc: number; duThao: number };
  byTinhTrang: Array<{ key: string; count: number }>;
  byDanhMuc: Array<{ key: string; count: number }>;
};

export async function apiGetTaiLieuStatsAggregates(
  params?: Omit<ApiTaiLieuListParams, 'limit' | 'offset' | 'orderBy' | 'ascending'>,
): Promise<ApiTaiLieuStatsAggregates> {
  const searchParams = new URLSearchParams();
  appendListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch(`/tai-lieu/stats/aggregates${qs ? `?${qs}` : ''}`);
}

export async function apiGetTaiLieu(id: string): Promise<TaiLieu> {
  return apiFetch<TaiLieu>(`/tai-lieu/${id}`);
}

export async function apiCreateTaiLieu(data: Record<string, unknown>): Promise<TaiLieu> {
  return apiFetch<TaiLieu>('/tai-lieu', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateTaiLieu(id: string, data: Record<string, unknown>): Promise<TaiLieu> {
  return apiFetch<TaiLieu>(`/tai-lieu/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiDeleteTaiLieu(id: string): Promise<void> {
  await apiFetch(`/tai-lieu/${id}`, { method: 'DELETE' });
}

export async function apiDeleteTaiLieuBatch(ids: string[]): Promise<void> {
  await apiFetch('/tai-lieu/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) });
}

export async function apiGetDistinctDanhMuc(): Promise<string[]> {
  const data = await apiFetch<{ items: string[] }>('/tai-lieu/distinct-danh-muc');
  return data.items;
}

export async function apiGetDistinctTenHoSo(): Promise<string[]> {
  const data = await apiFetch<{ items: string[] }>('/tai-lieu/distinct-ten-ho-so');
  return data.items;
}

export async function apiGetDistinctPhongBan(): Promise<string[]> {
  const data = await apiFetch<{ items: string[] }>('/nhan-vien/distinct-phong-ban');
  return data.items;
}

export type ApiCongViecListParams = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  cap?: string[];
  uu_tien?: string[];
  to_ar?: string[];
  to_r?: string[];
  mnv_a?: string[];
  mnv_r?: string[];
  mnv_c?: string[];
  trang_thai?: string[];
};

function appendCongViecListParams(searchParams: URLSearchParams, params?: ApiCongViecListParams): void {
  if (!params) return;
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.offset != null) searchParams.set('offset', String(params.offset));
  if (params.orderBy) searchParams.set('orderBy', params.orderBy);
  if (params.ascending != null) searchParams.set('ascending', String(params.ascending));
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.cap?.length) searchParams.set('cap', params.cap.join(','));
  if (params.uu_tien?.length) searchParams.set('uu_tien', params.uu_tien.join(','));
  if (params.to_ar?.length) searchParams.set('to_ar', params.to_ar.join(','));
  if (params.to_r?.length) searchParams.set('to_r', params.to_r.join(','));
  if (params.mnv_a?.length) searchParams.set('mnv_a', params.mnv_a.join(','));
  if (params.mnv_r?.length) searchParams.set('mnv_r', params.mnv_r.join(','));
  if (params.mnv_c?.length) searchParams.set('mnv_c', params.mnv_c.join(','));
  if (params.trang_thai?.length) searchParams.set('trang_thai', params.trang_thai.join(','));
}

export async function apiGetCongViecPage(params?: ApiCongViecListParams): Promise<ListResult<CongViec>> {
  const searchParams = new URLSearchParams();
  appendCongViecListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch<ListResult<CongViec>>(`/danh-sach-cong-viec${qs ? `?${qs}` : ''}`);
}

export async function apiGetCongViecCount(
  params?: Omit<ApiCongViecListParams, 'limit' | 'offset' | 'orderBy' | 'ascending'>,
): Promise<{ total: number }> {
  const searchParams = new URLSearchParams();
  appendCongViecListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch<{ total: number }>(`/danh-sach-cong-viec/count${qs ? `?${qs}` : ''}`);
}

export async function apiGetCongViecFilterCounts(
  params?: Omit<ApiCongViecListParams, 'limit' | 'offset' | 'orderBy' | 'ascending'>,
): Promise<{ capCounts: Record<string, number>; uuTienCounts: Record<string, number>; toArCounts: Record<string, number> }> {
  const searchParams = new URLSearchParams();
  appendCongViecListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch(`/danh-sach-cong-viec/filter-counts${qs ? `?${qs}` : ''}`);
}

export type ApiCongViecStatsAggregates = {
  kpis: { total: number; hoanThanh: number; quaHan: number; dangThucHien: number };
  byCap: Array<{ key: string; count: number }>;
  byUuTien: Array<{ key: string; count: number }>;
  byNguoiPhuTrach: Array<{ key: string; count: number }>;
  byToTeam: Array<{ key: string; giao: number; hoanThanh: number; quaHan: number }>;
  byNguoiRaci: Array<{ key: string; ar: number; r: number; hoanThanh: number; quaHan: number }>;
};

export async function apiGetCongViecStatsAggregates(
  params?: Omit<ApiCongViecListParams, 'limit' | 'offset' | 'orderBy' | 'ascending'>,
): Promise<ApiCongViecStatsAggregates> {
  const searchParams = new URLSearchParams();
  appendCongViecListParams(searchParams, params);
  const qs = searchParams.toString();
  return apiFetch(`/danh-sach-cong-viec/stats/aggregates${qs ? `?${qs}` : ''}`);
}

export async function apiGetCongViec(id: string): Promise<CongViec> {
  return apiFetch<CongViec>(`/danh-sach-cong-viec/${id}`);
}

export async function apiCreateCongViec(data: Record<string, unknown>): Promise<CongViec> {
  return apiFetch<CongViec>('/danh-sach-cong-viec', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateCongViec(id: string, data: Record<string, unknown>): Promise<CongViec> {
  return apiFetch<CongViec>(`/danh-sach-cong-viec/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiDeleteCongViec(id: string): Promise<void> {
  await apiFetch(`/danh-sach-cong-viec/${id}`, { method: 'DELETE' });
}

export async function apiDeleteCongViecBatch(ids: string[]): Promise<void> {
  await apiFetch('/danh-sach-cong-viec/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) });
}

export async function apiGetDistinctTieuDe(): Promise<string[]> {
  const data = await apiFetch<{ items: string[] }>('/danh-sach-cong-viec/distinct-tieu-de');
  return data.items;
}
