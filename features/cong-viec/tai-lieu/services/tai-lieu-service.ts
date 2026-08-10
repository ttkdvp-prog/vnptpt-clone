import type { TaiLieu } from '../core/types';
import type { TaiLieuFormValues } from '../core/schema';
import { MOCK_TAI_LIEU } from '@/mocks/cong-viec';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateTaiLieu,
  apiDeleteTaiLieu,
  apiDeleteTaiLieuBatch,
  apiGetDistinctDanhMuc,
  apiGetDistinctPhongBan,
  apiGetDistinctTenHoSo,
  apiGetTaiLieu,
  apiGetTaiLieuCount,
  apiGetTaiLieuFilterCounts,
  apiGetTaiLieuStatsAggregates,
  apiGetTaiLieuPage,
  apiUpdateTaiLieu,
  type ApiTaiLieuListParams,
  type ApiTaiLieuStatsAggregates,
} from '@/lib/api/cong-viec';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { TAI_LIEU_SEARCHABLE_KEYS } from '../core/search-keys';
import { txt } from '@/lib/text';

const mockSeed: TaiLieu[] = MOCK_TAI_LIEU;

const repo = createRepository<TaiLieu>({
  tableName: 'tai_lieu',
  mockData: mockSeed,
  delay: 400,
});

/** Không có sheet var_nhan_vien thật ở mock mode — cố định vài phòng khớp seed `mocks/cong-viec.ts`. */
const MOCK_PHONG_BAN = ['PB001', 'PB002', 'PB003'];

export type GetTaiLieuParams = ApiTaiLieuListParams;

function mockMatches(item: TaiLieu, params: GetTaiLieuParams): boolean {
  const searchOk = matchesSearchTerm(
    item as unknown as Record<string, unknown>,
    params.search ?? '',
    TAI_LIEU_SEARCHABLE_KEYS,
  );
  const statusOk = !params.tinh_trang?.length || params.tinh_trang.includes(item.tinh_trang);
  const danhMucOk = !params.danh_muc?.length || params.danh_muc.includes(item.danh_muc);
  const toOk = !params.to?.length || params.to.includes(item.to);
  return Boolean(searchOk && statusOk && danhMucOk && toOk);
}

function mockSort(items: TaiLieu[], orderBy?: string, ascending = true): TaiLieu[] {
  const mul = ascending ? 1 : -1;
  return [...items].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    if (orderBy === 'ten_ho_so') {
      aVal = a.ten_ho_so;
      bVal = b.ten_ho_so;
    } else if (orderBy === 'ngay_ban_hanh') {
      aVal = a.ngay_ban_hanh;
      bVal = b.ngay_ban_hanh;
    } else {
      aVal = Number(a.id) || 0;
      bVal = Number(b.id) || 0;
    }
    const cmp =
      typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), 'vi');
    return mul * cmp;
  });
}

export type TaiLieuListResult = { items: TaiLieu[]; total: number };
export type TaiLieuFilterCountsResult = {
  tinhTrangCounts: Record<string, number>;
  danhMucCounts: Record<string, number>;
};

export const getTaiLieuCount = async (params: GetTaiLieuParams = {}): Promise<number> => {
  if (isApi()) {
    const { total } = await apiGetTaiLieuCount(params);
    return total;
  }
  const all = await repo.getAll();
  return all.filter((i) => mockMatches(i, params)).length;
};

export const getTaiLieuPage = async (params: GetTaiLieuParams = {}): Promise<TaiLieuListResult> => {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const orderBy = params.orderBy ?? 'id';
  const ascending = params.ascending ?? true;

  if (isApi()) {
    const page = await apiGetTaiLieuPage({ ...params, limit, offset, orderBy, ascending });
    return { items: page.items, total: page.total };
  }

  const all = await repo.getAll();
  const filtered = mockSort(all.filter((i) => mockMatches(i, params)), orderBy, ascending);
  return { items: filtered.slice(offset, offset + limit), total: filtered.length };
};

export const getTaiLieuFilterCounts = async (
  params: GetTaiLieuParams = {},
): Promise<TaiLieuFilterCountsResult> => {
  if (isApi()) {
    return apiGetTaiLieuFilterCounts(params);
  }
  const all = await repo.getAll();
  const baseFilter = (item: TaiLieu) =>
    matchesSearchTerm(item as unknown as Record<string, unknown>, params.search ?? '', TAI_LIEU_SEARCHABLE_KEYS);

  const tinhTrangCounts: Record<string, number> = {};
  const danhMucCounts: Record<string, number> = {};
  for (const item of all.filter(baseFilter)) {
    tinhTrangCounts[item.tinh_trang] = (tinhTrangCounts[item.tinh_trang] ?? 0) + 1;
    if (item.danh_muc) danhMucCounts[item.danh_muc] = (danhMucCounts[item.danh_muc] ?? 0) + 1;
  }
  return { tinhTrangCounts, danhMucCounts };
};

export const getTaiLieuStatsAggregates = async (
  params: GetTaiLieuParams = {},
): Promise<ApiTaiLieuStatsAggregates> => {
  if (isApi()) {
    return apiGetTaiLieuStatsAggregates(params);
  }
  const all = await repo.getAll();
  const filtered = all.filter((i) => mockMatches(i, params));

  const tinhTrangMap: Record<string, number> = {};
  const danhMucMap: Record<string, number> = {};
  for (const item of filtered) {
    tinhTrangMap[item.tinh_trang] = (tinhTrangMap[item.tinh_trang] ?? 0) + 1;
    if (item.danh_muc) danhMucMap[item.danh_muc] = (danhMucMap[item.danh_muc] ?? 0) + 1;
  }

  return {
    kpis: {
      total: filtered.length,
      dangHieuLuc: tinhTrangMap['Đang hiệu lực'] ?? 0,
      hetHieuLuc: tinhTrangMap['Hết hiệu lực'] ?? 0,
      duThao: tinhTrangMap['Dự thảo'] ?? 0,
    },
    byTinhTrang: Object.entries(tinhTrangMap).map(([key, count]) => ({ key, count })),
    byDanhMuc: Object.entries(danhMucMap).map(([key, count]) => ({ key, count })),
  };
};

export const getTaiLieuById = async (id: string): Promise<TaiLieu> => {
  if (isApi()) {
    return apiGetTaiLieu(id);
  }
  const row = await repo.getById(id);
  if (!row) throw new Error(txt('congViecTaiLieu.service.notFound'));
  return row;
};

export const getDistinctDanhMuc = async (): Promise<string[]> => {
  if (isApi()) {
    return apiGetDistinctDanhMuc();
  }
  const all = await repo.getAll();
  const set = new Set<string>();
  for (const item of all) {
    if (item.danh_muc?.trim()) set.add(item.danh_muc.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
};

export const getDistinctPhongBan = async (): Promise<string[]> => {
  if (isApi()) {
    return apiGetDistinctPhongBan();
  }
  return MOCK_PHONG_BAN;
};

export const getDistinctTenHoSo = async (): Promise<string[]> => {
  if (isApi()) {
    return apiGetDistinctTenHoSo();
  }
  const all = await repo.getAll();
  const set = new Set<string>();
  for (const item of all) {
    if (item.ten_ho_so?.trim()) set.add(item.ten_ho_so.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
};

export const createTaiLieuRecord = async (data: TaiLieuFormValues): Promise<TaiLieu> => {
  if (isApi()) {
    return apiCreateTaiLieu(data);
  }
  const all = await repo.getAll();
  const nextIdNum = all.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  const now = new Date().toISOString();
  const inserted = await repo.insert({
    ...data,
    id: String(nextIdNum),
    so_ho_so: String(nextIdNum),
    ngay_ket_thuc: data.ngay_ket_thuc || null,
    url: data.url || '',
    mo_ta: data.mo_ta || '',
    nguoi_tao: 'mock-user',
    tg_tao: now,
    tg_cap_nhat: now,
  } as Omit<TaiLieu, 'id'> & { id: string });
  return inserted;
};

export const updateTaiLieuRecord = async (id: string, data: TaiLieuFormValues): Promise<TaiLieu> => {
  if (isApi()) {
    return apiUpdateTaiLieu(id, data);
  }
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('congViecTaiLieu.service.notFound'));
  return repo.update(id, {
    ...data,
    ngay_ket_thuc: data.ngay_ket_thuc || null,
    url: data.url || '',
    mo_ta: data.mo_ta || '',
    tg_cap_nhat: new Date().toISOString(),
  });
};

export const deleteTaiLieuRecord = async (id: string): Promise<void> => {
  if (isApi()) {
    await apiDeleteTaiLieu(id);
    return;
  }
  await repo.remove([id]);
};

export const deleteTaiLieuRecords = async (ids: string[]): Promise<void> => {
  if (isApi()) {
    await apiDeleteTaiLieuBatch(ids);
    return;
  }
  await repo.remove(ids);
};
