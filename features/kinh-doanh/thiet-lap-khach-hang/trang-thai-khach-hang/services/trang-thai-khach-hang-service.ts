import type { TrangThaiKhachHang } from '../core/types';
import type { TrangThaiKhachHangFormValues } from '../core/schema';
import { trangThaiKhachHangSchema } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateTrangThaiKhachHang,
  apiDeleteTrangThaiKhachHang,
  apiGetTrangThaiKhachHangList,
  apiImportTrangThaiKhachHang,
  apiUpdateTrangThaiKhachHang,
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

const MOCK_TRANG_THAI: TrangThaiKhachHang[] = [
  {
    id: '1',
    ten_trang_thai: 'Mới',
    mo_ta: 'Vừa tạo hồ sơ, chưa bắt đầu chăm sóc',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '2',
    ten_trang_thai: 'Đang chăm sóc',
    mo_ta: 'Đang trong quy trình chăm sóc / bán hàng',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '3',
    ten_trang_thai: 'Chốt deal',
    mo_ta: 'Đã ký kết / phát sinh doanh số',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '4',
    ten_trang_thai: 'Tạm ngưng',
    mo_ta: 'Tạm dừng liên hệ, có thể tái kích hoạt',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const repo = createRepository<TrangThaiKhachHang>({
  tableName: 'kh_thiet_lap_trang_thai',
  mockData: MOCK_TRANG_THAI,
  delay: 300,
});

export async function getTrangThaiKhachHangList(): Promise<TrangThaiKhachHang[]> {
  if (isApi()) return apiGetTrangThaiKhachHangList();
  return repo.getAll();
}

export async function createTrangThaiKhachHang(
  data: TrangThaiKhachHangFormValues,
): Promise<TrangThaiKhachHang> {
  if (isApi()) return apiCreateTrangThaiKhachHang(data);
  const now = ts();
  return repo.insert({
    ten_trang_thai: data.ten_trang_thai,
    mo_ta: data.mo_ta ?? null,
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
}

export async function updateTrangThaiKhachHang(
  id: string,
  data: TrangThaiKhachHangFormValues,
): Promise<TrangThaiKhachHang> {
  if (isApi()) return apiUpdateTrangThaiKhachHang(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('customerSettings.trangThai.title'));
  return repo.update(id, {
    ten_trang_thai: data.ten_trang_thai,
    mo_ta: data.mo_ta ?? null,
    tg_cap_nhat: ts(),
  });
}

export async function deleteTrangThaiKhachHangList(ids: string[]): Promise<void> {
  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeleteTrangThaiKhachHang(id)));
    return;
  }
  await repo.remove(ids);
}

export async function importTrangThaiKhachHang(
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> {
  const buildPayload = (row: Record<string, unknown>): TrangThaiKhachHangFormValues =>
    parseForImport(trangThaiKhachHangSchema, {
      ten_trang_thai: String(row.ten_trang_thai ?? '').trim(),
      mo_ta: row.mo_ta == null ? null : String(row.mo_ta),
    });

  const postChunk = async (
    items: TrangThaiKhachHangFormValues[],
  ): Promise<BulkImportResult> => {
    if (isApi()) return apiImportTrangThaiKhachHang(items);
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createTrangThaiKhachHang(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildPayload, postChunk, options);
}
