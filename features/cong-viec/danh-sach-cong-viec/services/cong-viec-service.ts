import { getCongViecTrangThai, type CongViec } from '../core/types';
import { congViecSchema, type CongViecFormValues } from '../core/schema';
import { MOCK_CONG_VIEC } from '@/mocks/cong-viec';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateCongViec,
  apiDeleteCongViec,
  apiDeleteCongViecBatch,
  apiGetDistinctPhongBan,
  apiGetDistinctTieuDe,
  apiGetCongViec,
  apiGetCongViecCount,
  apiGetCongViecFilterCounts,
  apiGetCongViecStatsAggregates,
  apiGetCongViecPage,
  apiUpdateCongViec,
  type ApiCongViecListParams,
  type ApiCongViecStatsAggregates,
} from '@/lib/api/cong-viec';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { CONG_VIEC_SEARCHABLE_KEYS } from '../core/search-keys';
import { txt } from '@/lib/text';
import {
  parseForImport,
  runChunkedImport,
  type BulkImportResult,
  type ImportBatchRow,
  type ImportResult,
} from '@/lib/import';

const mockSeed: CongViec[] = MOCK_CONG_VIEC;

const repo = createRepository<CongViec>({
  tableName: 'cong_viec',
  mockData: mockSeed,
  delay: 400,
});

/** Không có sheet var_nhan_vien thật ở mock mode — cố định vài phòng khớp seed `mocks/cong-viec.ts`. */
const MOCK_PHONG_BAN = ['PB001', 'PB002', 'PB003'];

export type GetCongViecParams = ApiCongViecListParams;

function mockMatches(item: CongViec, params: GetCongViecParams): boolean {
  const searchOk = matchesSearchTerm(
    item as unknown as Record<string, unknown>,
    params.search ?? '',
    CONG_VIEC_SEARCHABLE_KEYS,
  );
  const capOk = !params.cap?.length || params.cap.includes(item.cap);
  const uuTienOk = !params.uu_tien?.length || params.uu_tien.includes(item.uu_tien);
  const toArOk = !params.to_ar?.length || params.to_ar.includes(item.to_ar);
  const toROk = !params.to_r?.length || (!!item.to_r && params.to_r.includes(item.to_r));
  const mnvAOk = !params.mnv_a?.length || params.mnv_a.includes(item.mnv_a);
  const mnvROk = !params.mnv_r?.length || params.mnv_r.some((id) => item.mnv_r?.split(',').map((s) => s.trim()).includes(id));
  const mnvCOk = !params.mnv_c?.length || params.mnv_c.some((id) => item.mnv_c?.split(',').map((s) => s.trim()).includes(id));
  const trangThaiOk = !params.trang_thai?.length || params.trang_thai.includes(getCongViecTrangThai(item));
  return Boolean(searchOk && capOk && uuTienOk && toArOk && toROk && mnvAOk && mnvROk && mnvCOk && trangThaiOk);
}

function mockSort(items: CongViec[], orderBy?: string, ascending = true): CongViec[] {
  const mul = ascending ? 1 : -1;
  return [...items].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    if (orderBy === 'tieu_de') {
      aVal = a.tieu_de;
      bVal = b.tieu_de;
    } else if (orderBy === 'ngay_kt') {
      aVal = a.ngay_kt;
      bVal = b.ngay_kt;
    } else if (orderBy === 'ngay_bd') {
      aVal = a.ngay_bd;
      bVal = b.ngay_bd;
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

export type CongViecListResult = { items: CongViec[]; total: number };
export type CongViecFilterCountsResult = {
  capCounts: Record<string, number>;
  uuTienCounts: Record<string, number>;
  toArCounts: Record<string, number>;
};

export const getCongViecCount = async (params: GetCongViecParams = {}): Promise<number> => {
  if (isApi()) {
    const { total } = await apiGetCongViecCount(params);
    return total;
  }
  const all = await repo.getAll();
  return all.filter((i) => mockMatches(i, params)).length;
};

export const getCongViecPage = async (params: GetCongViecParams = {}): Promise<CongViecListResult> => {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const orderBy = params.orderBy ?? 'id';
  const ascending = params.ascending ?? true;

  if (isApi()) {
    const page = await apiGetCongViecPage({ ...params, limit, offset, orderBy, ascending });
    return { items: page.items, total: page.total };
  }

  const all = await repo.getAll();
  const filtered = mockSort(all.filter((i) => mockMatches(i, params)), orderBy, ascending);
  return { items: filtered.slice(offset, offset + limit), total: filtered.length };
};

export const getCongViecFilterCounts = async (
  params: GetCongViecParams = {},
): Promise<CongViecFilterCountsResult> => {
  if (isApi()) {
    return apiGetCongViecFilterCounts(params);
  }
  const all = await repo.getAll();
  const baseFilter = (item: CongViec) =>
    matchesSearchTerm(item as unknown as Record<string, unknown>, params.search ?? '', CONG_VIEC_SEARCHABLE_KEYS);

  const capCounts: Record<string, number> = {};
  const uuTienCounts: Record<string, number> = {};
  const toArCounts: Record<string, number> = {};
  for (const item of all.filter(baseFilter)) {
    capCounts[item.cap] = (capCounts[item.cap] ?? 0) + 1;
    uuTienCounts[item.uu_tien] = (uuTienCounts[item.uu_tien] ?? 0) + 1;
    if (item.to_ar) toArCounts[item.to_ar] = (toArCounts[item.to_ar] ?? 0) + 1;
  }
  return { capCounts, uuTienCounts, toArCounts };
};

export const getCongViecStatsAggregates = async (
  params: GetCongViecParams = {},
): Promise<ApiCongViecStatsAggregates> => {
  if (isApi()) {
    return apiGetCongViecStatsAggregates(params);
  }
  const all = await repo.getAll();
  const filtered = all.filter((i) => mockMatches(i, params));

  const capMap: Record<string, number> = {};
  const uuTienMap: Record<string, number> = {};
  const nguoiPhuTrachMap: Record<string, number> = {};
  const toTeamMap: Record<string, { giao: number; hoanThanh: number; quaHan: number }> = {};
  const raciMap: Record<string, { ar: number; r: number; hoanThanh: number; quaHan: number }> = {};
  let hoanThanh = 0;
  let quaHan = 0;
  let dangThucHien = 0;
  for (const item of filtered) {
    if (item.cap) capMap[item.cap] = (capMap[item.cap] ?? 0) + 1;
    if (item.uu_tien) uuTienMap[item.uu_tien] = (uuTienMap[item.uu_tien] ?? 0) + 1;
    if (item.mnv_a) nguoiPhuTrachMap[item.mnv_a] = (nguoiPhuTrachMap[item.mnv_a] ?? 0) + 1;

    const trangThai = getCongViecTrangThai(item);
    if (trangThai === 'hoan_thanh') hoanThanh += 1;
    else if (trangThai === 'qua_han') quaHan += 1;
    else dangThucHien += 1;

    if (item.to_ar) {
      const team = (toTeamMap[item.to_ar] ??= { giao: 0, hoanThanh: 0, quaHan: 0 });
      team.giao += 1;
      if (trangThai === 'hoan_thanh') team.hoanThanh += 1;
      else if (trangThai === 'qua_han') team.quaHan += 1;
    }

    const raciPeople = new Set<string>();
    if (item.mnv_a) {
      const p = (raciMap[item.mnv_a] ??= { ar: 0, r: 0, hoanThanh: 0, quaHan: 0 });
      p.ar += 1;
      raciPeople.add(item.mnv_a);
    }
    for (const id of (item.mnv_r ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const p = (raciMap[id] ??= { ar: 0, r: 0, hoanThanh: 0, quaHan: 0 });
      p.r += 1;
      raciPeople.add(id);
    }
    for (const id of raciPeople) {
      if (trangThai === 'hoan_thanh') raciMap[id]!.hoanThanh += 1;
      else if (trangThai === 'qua_han') raciMap[id]!.quaHan += 1;
    }
  }

  return {
    kpis: { total: filtered.length, hoanThanh, quaHan, dangThucHien },
    byCap: Object.entries(capMap).map(([key, count]) => ({ key, count })),
    byUuTien: Object.entries(uuTienMap).map(([key, count]) => ({ key, count })),
    byNguoiPhuTrach: Object.entries(nguoiPhuTrachMap).map(([key, count]) => ({ key, count })),
    byToTeam: Object.entries(toTeamMap).map(([key, v]) => ({ key, ...v })),
    byNguoiRaci: Object.entries(raciMap).map(([key, v]) => ({ key, ...v })),
  };
};

export const getCongViecById = async (id: string): Promise<CongViec> => {
  if (isApi()) {
    return apiGetCongViec(id);
  }
  const row = await repo.getById(id);
  if (!row) throw new Error(txt('congViec.service.notFound'));
  return row;
};

export const getDistinctPhongBan = async (): Promise<string[]> => {
  if (isApi()) {
    return apiGetDistinctPhongBan();
  }
  return MOCK_PHONG_BAN;
};

export const getDistinctTieuDe = async (): Promise<string[]> => {
  if (isApi()) {
    return apiGetDistinctTieuDe();
  }
  const all = await repo.getAll();
  const set = new Set<string>();
  for (const item of all) {
    if (item.tieu_de?.trim()) set.add(item.tieu_de.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
};

export const createCongViecRecord = async (data: CongViecFormValues): Promise<CongViec> => {
  if (isApi()) {
    return apiCreateCongViec(data);
  }
  const all = await repo.getAll();
  const nextIdNum = all.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  const now = new Date().toISOString();
  const inserted = await repo.insert({
    ...data,
    id: String(nextIdNum),
    mo_ta: data.mo_ta || '',
    to_r: data.to_r || '',
    mnv_r: data.mnv_r || '',
    mnv_c: data.mnv_c || '',
    ghi_chu: data.ghi_chu || '',
    ngay_ht: data.ngay_ht || null,
    tep_dinh_kem: data.tep_dinh_kem || '',
    ke_hoach: data.ke_hoach ?? null,
    thuc_hien: data.thuc_hien ?? null,
    nguoi_tao: 'mock-user',
    tg_tao: now,
    tg_cap_nhat: now,
  } as Omit<CongViec, 'id'> & { id: string });
  return inserted;
};

export const updateCongViecRecord = async (id: string, data: CongViecFormValues): Promise<CongViec> => {
  if (isApi()) {
    return apiUpdateCongViec(id, data);
  }
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('congViec.service.notFound'));
  return repo.update(id, {
    ...data,
    mo_ta: data.mo_ta || '',
    to_r: data.to_r || '',
    mnv_r: data.mnv_r || '',
    mnv_c: data.mnv_c || '',
    ghi_chu: data.ghi_chu || '',
    ngay_ht: data.ngay_ht || null,
    tep_dinh_kem: data.tep_dinh_kem || '',
    ke_hoach: data.ke_hoach ?? null,
    thuc_hien: data.thuc_hien ?? null,
    tg_cap_nhat: new Date().toISOString(),
  });
};

export const deleteCongViecRecord = async (id: string): Promise<void> => {
  if (isApi()) {
    await apiDeleteCongViec(id);
    return;
  }
  await repo.remove([id]);
};

export const deleteCongViecRecords = async (ids: string[]): Promise<void> => {
  if (isApi()) {
    await apiDeleteCongViecBatch(ids);
    return;
  }
  await repo.remove(ids);
};

/** Excel serial date (numeric) hoặc `DD/MM/YYYY` → `YYYY-MM-DD` cho khớp `RhfDataField` dataType="date". */
function normalizeImportDate(raw: unknown): string {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'number') {
    const ms = Math.round((raw - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
  }
  return s;
}

function buildImportPayload(row: Record<string, unknown>): CongViecFormValues {
  const payload = {
    cap: String(row.cap ?? '').trim(),
    tieu_de: String(row.tieu_de ?? '').trim(),
    mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() : '',
    to_ar: String(row.to_ar ?? '').trim(),
    to_r: row.to_r != null ? String(row.to_r).trim() : '',
    mnv_a: String(row.mnv_a ?? '').trim(),
    mnv_r: row.mnv_r != null ? String(row.mnv_r).trim() : '',
    mnv_c: row.mnv_c != null ? String(row.mnv_c).trim() : '',
    uu_tien: String(row.uu_tien ?? '').trim(),
    ngay_bd: normalizeImportDate(row.ngay_bd),
    ngay_kt: normalizeImportDate(row.ngay_kt),
    ghi_chu: row.ghi_chu != null ? String(row.ghi_chu).trim() : '',
    ngay_ht: row.ngay_ht != null ? normalizeImportDate(row.ngay_ht) : '',
  };
  return parseForImport(congViecSchema, payload);
}

export const importCongViec = async (
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> => {
  const postChunk = async (items: CongViecFormValues[]): Promise<BulkImportResult> => {
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createCongViecRecord(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildImportPayload, postChunk, {
    chunkSize: 10,
    onProgress: options?.onProgress,
  });
};
