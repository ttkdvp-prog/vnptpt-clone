import { apiFetch } from '@/lib/api/client';
import type { BulkImportResult } from '@/lib/import';
import type { NhomKhachHang } from '@/features/kinh-doanh/thiet-lap-khach-hang/nhom-khach-hang/core/types';
import type { NhomKhachHangFormValues } from '@/features/kinh-doanh/thiet-lap-khach-hang/nhom-khach-hang/core/schema';
import type { TrangThaiKhachHang } from '@/features/kinh-doanh/thiet-lap-khach-hang/trang-thai-khach-hang/core/types';
import type { TrangThaiKhachHangFormValues } from '@/features/kinh-doanh/thiet-lap-khach-hang/trang-thai-khach-hang/core/schema';
import type { KhachHang } from '@/features/kinh-doanh/khach-hang/core/types';
import type { KhachHangFormValues } from '@/features/kinh-doanh/khach-hang/core/schema';
import type { NguoiLienHe } from '@/features/kinh-doanh/nguoi-lien-he/core/types';
import type { NguoiLienHeFormValues } from '@/features/kinh-doanh/nguoi-lien-he/core/schema';

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

export async function apiGetNhomKhachHangPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<ListResult<NhomKhachHang>> {
  return apiFetch<ListResult<NhomKhachHang>>(`/nhom-khach-hang${pageQs(params)}`);
}

export async function apiGetNhomKhachHangList(): Promise<NhomKhachHang[]> {
  const data = await apiGetNhomKhachHangPage({ limit: 5000, offset: 0 });
  return data.items;
}

export async function apiCreateNhomKhachHang(
  data: NhomKhachHangFormValues,
): Promise<NhomKhachHang> {
  return apiFetch<NhomKhachHang>('/nhom-khach-hang', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportNhomKhachHang(
  items: NhomKhachHangFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/nhom-khach-hang/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateNhomKhachHang(
  id: string,
  data: Partial<NhomKhachHangFormValues>,
): Promise<NhomKhachHang> {
  return apiFetch<NhomKhachHang>(`/nhom-khach-hang/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteNhomKhachHang(id: string): Promise<void> {
  await apiFetch(`/nhom-khach-hang/${id}`, { method: 'DELETE' });
}

export async function apiGetTrangThaiKhachHangPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<ListResult<TrangThaiKhachHang>> {
  return apiFetch<ListResult<TrangThaiKhachHang>>(`/trang-thai-khach-hang${pageQs(params)}`);
}

export async function apiGetTrangThaiKhachHangList(): Promise<TrangThaiKhachHang[]> {
  const data = await apiGetTrangThaiKhachHangPage({ limit: 5000, offset: 0 });
  return data.items;
}

export async function apiCreateTrangThaiKhachHang(
  data: TrangThaiKhachHangFormValues,
): Promise<TrangThaiKhachHang> {
  return apiFetch<TrangThaiKhachHang>('/trang-thai-khach-hang', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportTrangThaiKhachHang(
  items: TrangThaiKhachHangFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/trang-thai-khach-hang/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateTrangThaiKhachHang(
  id: string,
  data: Partial<TrangThaiKhachHangFormValues>,
): Promise<TrangThaiKhachHang> {
  return apiFetch<TrangThaiKhachHang>(`/trang-thai-khach-hang/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteTrangThaiKhachHang(id: string): Promise<void> {
  await apiFetch(`/trang-thai-khach-hang/${id}`, { method: 'DELETE' });
}

export async function apiGetKhachHangPage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
}): Promise<ListResult<KhachHang>> {
  return apiFetch<ListResult<KhachHang>>(`/khach-hang${pageQs(params)}`);
}

export async function apiGetKhachHangList(): Promise<KhachHang[]> {
  const data = await apiGetKhachHangPage({ limit: 5000, offset: 0 });
  return data.items;
}

export async function apiGetNextMaKhachHang(): Promise<string> {
  const data = await apiFetch<{ ma_khach_hang: string }>('/khach-hang/next-ma');
  return data.ma_khach_hang;
}

export async function apiCreateKhachHang(data: KhachHangFormValues): Promise<KhachHang> {
  return apiFetch<KhachHang>('/khach-hang', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportKhachHang(
  items: KhachHangFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/khach-hang/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateKhachHang(
  id: string,
  data: Partial<KhachHangFormValues>,
): Promise<KhachHang> {
  return apiFetch<KhachHang>(`/khach-hang/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteKhachHang(id: string): Promise<void> {
  await apiFetch(`/khach-hang/${id}`, { method: 'DELETE' });
}

export async function apiGetNguoiLienHePage(params?: {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  search?: string;
  id_khach_hang?: string;
}): Promise<ListResult<NguoiLienHe>> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set('limit', String(params.limit));
  if (params?.offset != null) qs.set('offset', String(params.offset));
  if (params?.orderBy) qs.set('orderBy', params.orderBy);
  if (params?.ascending != null) qs.set('ascending', String(params.ascending));
  if (params?.search) qs.set('search', params.search);
  if (params?.id_khach_hang) qs.set('id_khach_hang', params.id_khach_hang);
  const s = qs.toString();
  return apiFetch<ListResult<NguoiLienHe>>(`/nguoi-lien-he${s ? `?${s}` : ''}`);
}

export async function apiGetNguoiLienHeList(id_khach_hang?: string): Promise<NguoiLienHe[]> {
  const data = await apiGetNguoiLienHePage({
    limit: 5000,
    offset: 0,
    id_khach_hang,
  });
  return data.items;
}

export async function apiCreateNguoiLienHe(
  data: NguoiLienHeFormValues,
): Promise<NguoiLienHe> {
  return apiFetch<NguoiLienHe>('/nguoi-lien-he', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiImportNguoiLienHe(
  items: NguoiLienHeFormValues[],
): Promise<BulkImportResult> {
  return apiFetch<BulkImportResult>('/nguoi-lien-he/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function apiUpdateNguoiLienHe(
  id: string,
  data: Partial<NguoiLienHeFormValues>,
): Promise<NguoiLienHe> {
  return apiFetch<NguoiLienHe>(`/nguoi-lien-he/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteNguoiLienHe(id: string): Promise<void> {
  await apiFetch(`/nguoi-lien-he/${id}`, { method: 'DELETE' });
}
