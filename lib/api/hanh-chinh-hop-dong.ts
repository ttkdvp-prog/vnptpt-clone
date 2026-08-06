import { apiFetch } from '@/lib/api/client';
import type { HopDong } from '@/features/hanh-chinh/hop-dong/core/types';
import type { HopDongFormValues } from '@/features/hanh-chinh/hop-dong/core/schema';

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

export async function apiGetHopDongPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<ListResult<HopDong>> {
  return apiFetch<ListResult<HopDong>>(`/hop-dong${pageQs(params)}`);
}

export async function apiGetHopDongList(): Promise<HopDong[]> {
  const data = await apiGetHopDongPage({
    limit: 5000,
    offset: 0,
    orderBy: 'tg_cap_nhat',
    ascending: false,
  });
  return data.items;
}

export async function apiGetHopDong(id: string): Promise<HopDong> {
  return apiFetch<HopDong>(`/hop-dong/${id}`);
}

export async function apiCreateHopDong(data: HopDongFormValues): Promise<HopDong> {
  return apiFetch<HopDong>('/hop-dong', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateHopDong(
  id: string,
  data: Partial<HopDongFormValues>,
): Promise<HopDong> {
  return apiFetch<HopDong>(`/hop-dong/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteHopDong(id: string): Promise<void> {
  await apiFetch(`/hop-dong/${id}`, { method: 'DELETE' });
}
