import { apiFetch } from '@/lib/api/client';
import type { MarketIn } from '@/features/san-xuat/danh-sach-market-in/core/types';
import type { MarketInFormValues } from '@/features/san-xuat/danh-sach-market-in/core/schema';
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

export async function apiGetMarketInPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<ListResult<MarketIn>> {
  return apiFetch<ListResult<MarketIn>>(`/market-in${pageQs(params)}`);
}

export async function apiGetMarketInList(): Promise<MarketIn[]> {
  const data = await apiGetMarketInPage({ limit: 5000, offset: 0, orderBy: 'thu_tu' });
  return data.items;
}

export async function apiGetNextMaMarket(): Promise<string> {
  const data = await apiFetch<{ ma_market: string }>('/market-in/next-ma');
  return data.ma_market;
}

export async function apiCreateMarketIn(data: MarketInFormValues): Promise<MarketIn> {
  return apiFetch<MarketIn>('/market-in', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportMarketIn(
  items: MarketInFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/market-in/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateMarketIn(
  id: string,
  data: Partial<MarketInFormValues>,
): Promise<MarketIn> {
  return apiFetch<MarketIn>(`/market-in/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiApproveMarketIn(id: string): Promise<MarketIn> {
  return apiFetch<MarketIn>(`/market-in/${id}/duyet`, { method: 'POST' });
}

export async function apiSuspendMarketIn(id: string): Promise<MarketIn> {
  return apiFetch<MarketIn>(`/market-in/${id}/ngung`, { method: 'POST' });
}

export async function apiDeleteMarketIn(id: string): Promise<void> {
  await apiFetch(`/market-in/${id}`, { method: 'DELETE' });
}
