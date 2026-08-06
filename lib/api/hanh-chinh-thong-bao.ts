import { apiFetch } from '@/lib/api/client';
import type { ThongBao } from '@/features/hanh-chinh/thong-bao/core/types';
import type { ThongBaoFormValues } from '@/features/hanh-chinh/thong-bao/core/schema';

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

export async function apiGetThongBaoPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<ListResult<ThongBao>> {
  return apiFetch<ListResult<ThongBao>>(`/hc-thong-bao${pageQs(params)}`);
}

export async function apiGetThongBaoList(): Promise<ThongBao[]> {
  const data = await apiGetThongBaoPage({
    limit: 5000,
    offset: 0,
    orderBy: 'tg_dang',
    ascending: false,
  });
  return data.items;
}

export async function apiGetThongBao(id: string): Promise<ThongBao> {
  return apiFetch<ThongBao>(`/hc-thong-bao/${id}`);
}

export async function apiCreateThongBao(data: ThongBaoFormValues): Promise<ThongBao> {
  return apiFetch<ThongBao>('/hc-thong-bao', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateThongBao(
  id: string,
  data: Partial<ThongBaoFormValues>,
): Promise<ThongBao> {
  return apiFetch<ThongBao>(`/hc-thong-bao/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteThongBao(id: string): Promise<void> {
  await apiFetch(`/hc-thong-bao/${id}`, { method: 'DELETE' });
}
