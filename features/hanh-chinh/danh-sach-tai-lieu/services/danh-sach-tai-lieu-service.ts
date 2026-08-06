import type { DanhSachTaiLieu } from '../core/types';
import { DOCUMENT_STATUS } from '../core/types';
import type { DanhSachTaiLieuFormValues } from '../core/schema';
import { danhSachTaiLieuSchema } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateDanhSachTaiLieu,
  apiDeleteDanhSachTaiLieu,
  apiGetDanhSachTaiLieuList,
  apiImportDanhSachTaiLieu,
  apiUpdateDanhSachTaiLieu,
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

const MOCK_DOCS: DanhSachTaiLieu[] = [
  {
    id: '1',
    id_loai_tai_lieu: '1',
    ten_loai_tai_lieu: 'Hợp đồng',
    ten_tai_lieu: 'Mẫu hợp đồng lao động',
    mo_ta: 'Mẫu chuẩn dùng khi ký HĐLĐ',
    link_tai_lieu: 'https://example.com/hop-dong-ld',
    ghi_chu: 'Dùng nội bộ HCNS',
    trang_thai: DOCUMENT_STATUS.HIEU_LUC,
    id_chuc_vu: [],
    id_nhan_vien: [],
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '2',
    id_loai_tai_lieu: '2',
    ten_loai_tai_lieu: 'Biên bản',
    ten_tai_lieu: 'Biên bản bàn giao tài sản',
    mo_ta: 'Mẫu biên bản khi bàn giao thiết bị',
    link_tai_lieu: null,
    ghi_chu: null,
    trang_thai: DOCUMENT_STATUS.DU_THAO,
    id_chuc_vu: [],
    id_nhan_vien: [],
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const repo = createRepository<DanhSachTaiLieu>({
  tableName: 'tai_lieu_danh_sach_tai_lieu',
  mockData: MOCK_DOCS,
  delay: 300,
});

export async function getDanhSachTaiLieuList(): Promise<DanhSachTaiLieu[]> {
  if (isApi()) return apiGetDanhSachTaiLieuList();
  return repo.getAll();
}

export async function createDanhSachTaiLieu(
  data: DanhSachTaiLieuFormValues,
): Promise<DanhSachTaiLieu> {
  if (isApi()) return apiCreateDanhSachTaiLieu(data);
  const now = ts();
  return repo.insert({
    id_loai_tai_lieu: data.id_loai_tai_lieu,
    ten_tai_lieu: data.ten_tai_lieu,
    mo_ta: data.mo_ta ?? null,
    link_tai_lieu: data.link_tai_lieu ?? null,
    ghi_chu: data.ghi_chu ?? null,
    trang_thai: data.trang_thai,
    id_chuc_vu: data.id_chuc_vu ?? [],
    id_nhan_vien: data.id_nhan_vien ?? [],
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
}

export async function updateDanhSachTaiLieu(
  id: string,
  data: DanhSachTaiLieuFormValues,
): Promise<DanhSachTaiLieu> {
  if (isApi()) return apiUpdateDanhSachTaiLieu(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('document.title'));
  return repo.update(id, {
    id_loai_tai_lieu: data.id_loai_tai_lieu,
    ten_tai_lieu: data.ten_tai_lieu,
    mo_ta: data.mo_ta ?? null,
    link_tai_lieu: data.link_tai_lieu ?? null,
    ghi_chu: data.ghi_chu ?? null,
    trang_thai: data.trang_thai,
    id_chuc_vu: data.id_chuc_vu ?? [],
    id_nhan_vien: data.id_nhan_vien ?? [],
    tg_cap_nhat: ts(),
  });
}

export async function deleteDanhSachTaiLieuList(ids: string[]): Promise<void> {
  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeleteDanhSachTaiLieu(id)));
    return;
  }
  await repo.remove(ids);
}

export async function importDanhSachTaiLieu(
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> {
  const buildPayload = (row: Record<string, unknown>): DanhSachTaiLieuFormValues =>
    parseForImport(danhSachTaiLieuSchema, {
      id_loai_tai_lieu: String(row.id_loai_tai_lieu ?? '').trim(),
      ten_tai_lieu: String(row.ten_tai_lieu ?? '').trim(),
      mo_ta: row.mo_ta == null ? null : String(row.mo_ta),
      link_tai_lieu: row.link_tai_lieu == null ? null : String(row.link_tai_lieu),
      ghi_chu: row.ghi_chu == null ? null : String(row.ghi_chu),
      trang_thai: String(row.trang_thai ?? DOCUMENT_STATUS.DU_THAO).trim(),
      id_chuc_vu: [],
      id_nhan_vien: [],
    });

  const postChunk = async (
    items: DanhSachTaiLieuFormValues[],
  ): Promise<BulkImportResult> => {
    if (isApi()) return apiImportDanhSachTaiLieu(items);
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createDanhSachTaiLieu(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildPayload, postChunk, options);
}
