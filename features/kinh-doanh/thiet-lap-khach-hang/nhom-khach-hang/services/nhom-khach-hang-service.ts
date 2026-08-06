import type { NhomKhachHang } from '../core/types';
import type { NhomKhachHangFormValues } from '../core/schema';
import { nhomKhachHangSchema } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateNhomKhachHang,
  apiDeleteNhomKhachHang,
  apiGetNhomKhachHangList,
  apiImportNhomKhachHang,
  apiUpdateNhomKhachHang,
} from '@/lib/api/kinh-doanh';
import { getCurrentEmployeeId } from '@/lib/current-session-employee';
import {
  parseForImport,
  runChunkedImport,
  type BulkImportResult,
  type ImportBatchRow,
  type ImportResult,
} from '@/lib/import';
import { txt } from '@/lib/text';

const ts = () => new Date().toISOString();

const MOCK_NHOM: NhomKhachHang[] = [
  {
    id: '1',
    ten_nhom: 'VIP',
    mo_ta: 'Khách hàng chiến lược, ưu tiên chăm sóc cao',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '2',
    ten_nhom: 'Tiềm năng',
    mo_ta: 'Khách hàng đang trong giai đoạn tiếp cận',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '3',
    ten_nhom: 'Hiện hữu',
    mo_ta: 'Khách hàng đang giao dịch thường xuyên',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '4',
    ten_nhom: 'Ngừng hợp tác',
    mo_ta: 'Không còn quan hệ kinh doanh',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const repo = createRepository<NhomKhachHang>({
  tableName: 'kh_thiet_lap_nhom_khach_hang',
  mockData: MOCK_NHOM,
  delay: 300,
});

export async function getNhomKhachHangList(): Promise<NhomKhachHang[]> {
  if (isApi()) return apiGetNhomKhachHangList();
  return repo.getAll();
}

export async function createNhomKhachHang(
  data: NhomKhachHangFormValues,
): Promise<NhomKhachHang> {
  if (isApi()) return apiCreateNhomKhachHang(data);
  const now = ts();
  return repo.insert({
    ten_nhom: data.ten_nhom,
    mo_ta: data.mo_ta ?? null,
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
}

export async function updateNhomKhachHang(
  id: string,
  data: NhomKhachHangFormValues,
): Promise<NhomKhachHang> {
  if (isApi()) return apiUpdateNhomKhachHang(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('customerSettings.nhom.title'));
  return repo.update(id, {
    ten_nhom: data.ten_nhom,
    mo_ta: data.mo_ta ?? null,
    tg_cap_nhat: ts(),
  });
}

export async function deleteNhomKhachHangList(ids: string[]): Promise<void> {
  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeleteNhomKhachHang(id)));
    return;
  }
  await repo.remove(ids);
}

export async function importNhomKhachHang(
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> {
  const buildPayload = (row: Record<string, unknown>): NhomKhachHangFormValues =>
    parseForImport(nhomKhachHangSchema, {
      ten_nhom: String(row.ten_nhom ?? '').trim(),
      mo_ta: row.mo_ta == null ? null : String(row.mo_ta),
    });

  const postChunk = async (items: NhomKhachHangFormValues[]): Promise<BulkImportResult> => {
    if (isApi()) return apiImportNhomKhachHang(items);
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createNhomKhachHang(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildPayload, postChunk, options);
}
