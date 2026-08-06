import type { LoaiTaiLieu } from '../core/types';
import type { LoaiTaiLieuFormValues } from '../core/schema';
import { loaiTaiLieuSchema } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateLoaiTaiLieu,
  apiDeleteLoaiTaiLieu,
  apiGetLoaiTaiLieuList,
  apiImportLoaiTaiLieu,
  apiUpdateLoaiTaiLieu,
} from '@/lib/api/hanh-chinh';
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

const MOCK_LOAI: LoaiTaiLieu[] = [
  {
    id: '1',
    thu_tu: 1,
    ten_loai_tai_lieu: 'Hợp đồng',
    mo_ta: 'Tài liệu hợp đồng, thỏa thuận',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '2',
    thu_tu: 2,
    ten_loai_tai_lieu: 'Biên bản',
    mo_ta: 'Biên bản họp, biên bản bàn giao',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '3',
    thu_tu: 3,
    ten_loai_tai_lieu: 'Quy trình',
    mo_ta: 'Quy trình nội bộ, SOP',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const repo = createRepository<LoaiTaiLieu>({
  tableName: 'tai_lieu_thiet_lap_loai_tai_lieu',
  mockData: MOCK_LOAI,
  delay: 300,
});

export async function getLoaiTaiLieuList(): Promise<LoaiTaiLieu[]> {
  if (isApi()) return apiGetLoaiTaiLieuList();
  return repo.getAll();
}

export async function createLoaiTaiLieu(
  data: LoaiTaiLieuFormValues,
): Promise<LoaiTaiLieu> {
  if (isApi()) return apiCreateLoaiTaiLieu(data);
  const now = ts();
  return repo.insert({
    thu_tu: data.thu_tu,
    ten_loai_tai_lieu: data.ten_loai_tai_lieu,
    mo_ta: data.mo_ta ?? null,
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
}

export async function updateLoaiTaiLieu(
  id: string,
  data: LoaiTaiLieuFormValues,
): Promise<LoaiTaiLieu> {
  if (isApi()) return apiUpdateLoaiTaiLieu(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('documentSettings.loai.title'));
  return repo.update(id, {
    thu_tu: data.thu_tu,
    ten_loai_tai_lieu: data.ten_loai_tai_lieu,
    mo_ta: data.mo_ta ?? null,
    tg_cap_nhat: ts(),
  });
}

export async function deleteLoaiTaiLieuList(ids: string[]): Promise<void> {
  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeleteLoaiTaiLieu(id)));
    return;
  }
  await repo.remove(ids);
}

export async function importLoaiTaiLieu(
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> {
  const buildPayload = (row: Record<string, unknown>): LoaiTaiLieuFormValues =>
    parseForImport(loaiTaiLieuSchema, {
      thu_tu: row.thu_tu == null || row.thu_tu === '' ? 0 : Number(row.thu_tu),
      ten_loai_tai_lieu: String(row.ten_loai_tai_lieu ?? '').trim(),
      mo_ta: row.mo_ta == null ? null : String(row.mo_ta),
    });

  const postChunk = async (items: LoaiTaiLieuFormValues[]): Promise<BulkImportResult> => {
    if (isApi()) return apiImportLoaiTaiLieu(items);
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createLoaiTaiLieu(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildPayload, postChunk, options);
}
