import type { NguoiLienHe } from '../core/types';
import type { NguoiLienHeFormValues } from '../core/schema';
import { nguoiLienHeSchema } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateNguoiLienHe,
  apiDeleteNguoiLienHe,
  apiGetNguoiLienHeList,
  apiImportNguoiLienHe,
  apiUpdateNguoiLienHe,
} from '@/lib/api/kinh-doanh';
import { getKhachHangList } from '@/features/kinh-doanh/khach-hang/services/khach-hang-service';
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

const MOCK_NGUOI_LIEN_HE: NguoiLienHe[] = [
  {
    id: '1',
    id_khach_hang: '1',
    ho_ten: 'Nguyễn Văn An',
    ngay_sinh: '1985-03-12',
    chuc_vu: 'Giám đốc',
    so_dien_thoai: '0903111001',
    email: 'an.nguyen@minhphat.vn',
    dia_chi: null,
    ghi_chu: 'Người quyết định chính',
    ten_khach_hang: 'Công ty TNHH Minh Phát',
    ma_khach_hang: 'KH0001',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '2',
    id_khach_hang: '1',
    ho_ten: 'Trần Thị Bình',
    ngay_sinh: '1990',
    chuc_vu: 'Kế toán trưởng',
    so_dien_thoai: '0903111002',
    email: 'binh.tran@minhphat.vn',
    dia_chi: null,
    ghi_chu: null,
    ten_khach_hang: 'Công ty TNHH Minh Phát',
    ma_khach_hang: 'KH0001',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const repo = createRepository<NguoiLienHe>({
  tableName: 'kh_nguoi_lien_he',
  mockData: MOCK_NGUOI_LIEN_HE,
  delay: 300,
});

async function enrichMockNames(item: NguoiLienHe): Promise<NguoiLienHe> {
  const customers = await getKhachHangList();
  const kh = customers.find((c) => c.id === item.id_khach_hang);
  return {
    ...item,
    ten_khach_hang: kh?.ten_khach_hang ?? null,
    ma_khach_hang: kh?.ma_khach_hang ?? null,
  };
}

export async function getNguoiLienHeList(id_khach_hang?: string): Promise<NguoiLienHe[]> {
  if (isApi()) return apiGetNguoiLienHeList(id_khach_hang);
  const all = await repo.getAll();
  if (!id_khach_hang) return all;
  return all.filter((item) => item.id_khach_hang === id_khach_hang);
}

export async function createNguoiLienHe(data: NguoiLienHeFormValues): Promise<NguoiLienHe> {
  if (isApi()) return apiCreateNguoiLienHe(data);
  const now = ts();
  const inserted = await repo.insert({
    id_khach_hang: data.id_khach_hang,
    ho_ten: data.ho_ten,
    ngay_sinh: data.ngay_sinh ?? null,
    chuc_vu: data.chuc_vu ?? null,
    so_dien_thoai: data.so_dien_thoai ?? null,
    email: data.email ?? null,
    dia_chi: data.dia_chi ?? null,
    ghi_chu: data.ghi_chu ?? null,
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
  return enrichMockNames(inserted);
}

export async function updateNguoiLienHe(
  id: string,
  data: NguoiLienHeFormValues,
): Promise<NguoiLienHe> {
  if (isApi()) return apiUpdateNguoiLienHe(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('contact.title'));
  const updated = await repo.update(id, {
    id_khach_hang: data.id_khach_hang,
    ho_ten: data.ho_ten,
    ngay_sinh: data.ngay_sinh ?? null,
    chuc_vu: data.chuc_vu ?? null,
    so_dien_thoai: data.so_dien_thoai ?? null,
    email: data.email ?? null,
    dia_chi: data.dia_chi ?? null,
    ghi_chu: data.ghi_chu ?? null,
    tg_cap_nhat: ts(),
  });
  return enrichMockNames(updated);
}

/**
 * Sao chép toàn bộ người liên hệ của khách nguồn sang khách đích
 * (dùng khi Sao chép khách hàng — bản ghi con đi kèm bản ghi cha mới).
 */
export async function copyNguoiLienHeToCustomer(
  sourceCustomerId: string,
  targetCustomerId: string,
): Promise<number> {
  const contacts = await getNguoiLienHeList(sourceCustomerId);
  for (const c of contacts) {
    await createNguoiLienHe({
      id_khach_hang: targetCustomerId,
      ho_ten: c.ho_ten,
      ngay_sinh: c.ngay_sinh ?? null,
      chuc_vu: c.chuc_vu ?? null,
      so_dien_thoai: c.so_dien_thoai ?? null,
      email: c.email ?? null,
      dia_chi: c.dia_chi ?? null,
      ghi_chu: c.ghi_chu ?? null,
    });
  }
  return contacts.length;
}

export async function deleteNguoiLienHeList(ids: string[]): Promise<void> {
  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeleteNguoiLienHe(id)));
    return;
  }
  await repo.remove(ids);
}

export async function importNguoiLienHe(
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> {
  const customers = await getKhachHangList();
  const byMa = new Map(
    customers.map((c) => [c.ma_khach_hang.trim().toLowerCase(), c.id]),
  );
  const byTen = new Map(
    customers.map((c) => [c.ten_khach_hang.trim().toLowerCase(), c.id]),
  );

  const buildPayload = (row: Record<string, unknown>): NguoiLienHeFormValues => {
    const ma = String(row.ma_khach_hang ?? '').trim().toLowerCase();
    const ten = String(row.ten_khach_hang ?? '').trim().toLowerCase();
    const idKh = byMa.get(ma) ?? byTen.get(ten);
    if (!idKh) throw new Error(txt('contact.validation.customerRequired'));

    return parseForImport(nguoiLienHeSchema, {
      id_khach_hang: idKh,
      ho_ten: String(row.ho_ten ?? '').trim(),
      ngay_sinh: row.ngay_sinh == null ? null : String(row.ngay_sinh),
      chuc_vu: row.chuc_vu == null ? null : String(row.chuc_vu),
      so_dien_thoai: row.so_dien_thoai == null ? null : String(row.so_dien_thoai),
      email: row.email == null ? null : String(row.email),
      dia_chi: row.dia_chi == null ? null : String(row.dia_chi),
      ghi_chu: row.ghi_chu == null ? null : String(row.ghi_chu),
    });
  };

  const postChunk = async (items: NguoiLienHeFormValues[]): Promise<BulkImportResult> => {
    if (isApi()) return apiImportNguoiLienHe(items);
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createNguoiLienHe(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildPayload, postChunk, options);
}
