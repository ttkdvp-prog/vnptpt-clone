import type { KhachHang } from '../core/types';
import type { KhachHangFormValues } from '../core/schema';
import { khachHangSchema } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateKhachHang,
  apiDeleteKhachHang,
  apiGetKhachHangList,
  apiGetNextMaKhachHang,
  apiImportKhachHang,
  apiUpdateKhachHang,
} from '@/lib/api/kinh-doanh';
import { getNhomKhachHangList } from '@/features/kinh-doanh/thiet-lap-khach-hang/nhom-khach-hang/services/nhom-khach-hang-service';
import { getTrangThaiKhachHangList } from '@/features/kinh-doanh/thiet-lap-khach-hang/trang-thai-khach-hang/services/trang-thai-khach-hang-service';
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

const MOCK_KHACH_HANG: KhachHang[] = [
  {
    id: '1',
    ma_khach_hang: 'KH0001',
    ten_khach_hang: 'Công ty TNHH Minh Phát',
    so_dien_thoai: '0903111222',
    dia_chi: '12 Nguyễn Trãi, Q.1, TP.HCM',
    ghi_chu: 'Khách hàng lâu năm, ưu tiên báo giá sớm',
    id_nhom: '1',
    id_trang_thai: '2',
    ten_nhom: 'VIP',
    ten_trang_thai: 'Đang chăm sóc',
    so_nguoi_lien_he: 2,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '2',
    ma_khach_hang: 'KH0002',
    ten_khach_hang: 'Công ty CP Xây dựng Đại Nam',
    so_dien_thoai: '0912333444',
    dia_chi: '88 Lê Lợi, Đà Nẵng',
    ghi_chu: null,
    id_nhom: '1',
    id_trang_thai: '3',
    ten_nhom: 'VIP',
    ten_trang_thai: 'Chốt deal',
    so_nguoi_lien_he: 1,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '3',
    ma_khach_hang: 'KH0003',
    ten_khach_hang: 'Cửa hàng VLXD Hòa Bình',
    so_dien_thoai: '0987654321',
    dia_chi: '45 Trần Phú, Nha Trang',
    ghi_chu: 'Giới thiệu qua đối tác',
    id_nhom: '2',
    id_trang_thai: '1',
    ten_nhom: 'Tiềm năng',
    ten_trang_thai: 'Mới',
    so_nguoi_lien_he: 0,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const repo = createRepository<KhachHang>({
  tableName: 'kh_danh_sach_khach_hang',
  mockData: MOCK_KHACH_HANG,
  delay: 300,
});

async function enrichMockNames(item: KhachHang): Promise<KhachHang> {
  const [groups, statuses] = await Promise.all([
    getNhomKhachHangList(),
    getTrangThaiKhachHangList(),
  ]);
  return {
    ...item,
    ten_nhom: groups.find((g) => g.id === item.id_nhom)?.ten_nhom ?? null,
    ten_trang_thai:
      statuses.find((s) => s.id === item.id_trang_thai)?.ten_trang_thai ?? null,
  };
}

export async function getKhachHangList(): Promise<KhachHang[]> {
  if (isApi()) return apiGetKhachHangList();
  return repo.getAll();
}

const MA_PREFIX = 'KH';
const MA_PAD = 4;

/** Gợi ý mã tăng dần KH0001 — dùng cho form thêm mới. */
export async function getNextMaKhachHang(): Promise<string> {
  if (isApi()) return apiGetNextMaKhachHang();
  const items = await repo.getAll();
  const re = new RegExp(`^${MA_PREFIX}(\\d+)$`);
  let max = 0;
  for (const item of items) {
    const m = re.exec(item.ma_khach_hang);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${MA_PREFIX}${String(max + 1).padStart(MA_PAD, '0')}`;
}

export async function createKhachHang(data: KhachHangFormValues): Promise<KhachHang> {
  if (isApi()) return apiCreateKhachHang(data);
  const now = ts();
  const inserted = await repo.insert({
    ma_khach_hang: data.ma_khach_hang,
    ten_khach_hang: data.ten_khach_hang,
    so_dien_thoai: data.so_dien_thoai ?? null,
    dia_chi: data.dia_chi ?? null,
    ghi_chu: data.ghi_chu ?? null,
    id_nhom: data.id_nhom,
    id_trang_thai: data.id_trang_thai,
    so_nguoi_lien_he: 0,
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
  return enrichMockNames(inserted);
}

export async function updateKhachHang(
  id: string,
  data: KhachHangFormValues,
): Promise<KhachHang> {
  if (isApi()) return apiUpdateKhachHang(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('customer.title'));
  const updated = await repo.update(id, {
    ma_khach_hang: data.ma_khach_hang,
    ten_khach_hang: data.ten_khach_hang,
    so_dien_thoai: data.so_dien_thoai ?? null,
    dia_chi: data.dia_chi ?? null,
    ghi_chu: data.ghi_chu ?? null,
    id_nhom: data.id_nhom,
    id_trang_thai: data.id_trang_thai,
    tg_cap_nhat: ts(),
  });
  return enrichMockNames(updated);
}

/** Patch một phần (vd. đổi nhóm / trạng thái từ detail toolbar). */
export async function patchKhachHang(
  id: string,
  data: Partial<KhachHangFormValues>,
): Promise<KhachHang> {
  if (isApi()) return apiUpdateKhachHang(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('customer.title'));
  const updated = await repo.update(id, {
    ...data,
    tg_cap_nhat: ts(),
  });
  return enrichMockNames(updated);
}

export async function deleteKhachHangList(ids: string[]): Promise<void> {
  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeleteKhachHang(id)));
    return;
  }
  await repo.remove(ids);
}

export async function importKhachHang(
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> {
  const [groups, statuses] = await Promise.all([
    getNhomKhachHangList(),
    getTrangThaiKhachHangList(),
  ]);
  const groupByName = new Map(groups.map((g) => [g.ten_nhom.trim().toLowerCase(), g.id]));
  const statusByName = new Map(
    statuses.map((s) => [s.ten_trang_thai.trim().toLowerCase(), s.id]),
  );

  const buildPayload = (row: Record<string, unknown>): KhachHangFormValues => {
    const tenNhom = String(row.ten_nhom ?? '').trim().toLowerCase();
    const tenTrangThai = String(row.ten_trang_thai ?? '').trim().toLowerCase();
    const idNhom = groupByName.get(tenNhom);
    const idTrangThai = statusByName.get(tenTrangThai);
    if (!idNhom) throw new Error(txt('customer.validation.groupRequired'));
    if (!idTrangThai) throw new Error(txt('customer.validation.statusRequired'));

    return parseForImport(khachHangSchema, {
      ma_khach_hang: String(row.ma_khach_hang ?? '').trim(),
      ten_khach_hang: String(row.ten_khach_hang ?? '').trim(),
      so_dien_thoai: row.so_dien_thoai == null ? null : String(row.so_dien_thoai),
      dia_chi: row.dia_chi == null ? null : String(row.dia_chi),
      ghi_chu: row.ghi_chu == null ? null : String(row.ghi_chu),
      id_nhom: idNhom,
      id_trang_thai: idTrangThai,
    });
  };

  const postChunk = async (items: KhachHangFormValues[]): Promise<BulkImportResult> => {
    if (isApi()) return apiImportKhachHang(items);
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createKhachHang(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildPayload, postChunk, options);
}
