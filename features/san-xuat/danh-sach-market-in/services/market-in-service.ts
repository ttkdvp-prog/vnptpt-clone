import type { MarketIn } from '../core/types';
import { MARKET_IN_STATUS, MARKET_IN_STATUS_LABELS } from '../core/types';
import type { MarketInFormValues } from '../core/schema';
import { marketInSchema } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiApproveMarketIn,
  apiCreateMarketIn,
  apiDeleteMarketIn,
  apiGetMarketInList,
  apiGetNextMaMarket,
  apiImportMarketIn,
  apiSuspendMarketIn,
  apiUpdateMarketIn,
} from '@/lib/api/san-xuat';
import { getKhachHangList } from '@/features/kinh-doanh/khach-hang/services/khach-hang-service';
import {
  getAllEmployeesForLookup,
  getEmployees,
} from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
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

const MOCK_MARKET_IN: MarketIn[] = [
  {
    id: '1',
    thu_tu: 1,
    id_khach_hang: '1',
    ma_san_pham: 'SP-BAG-001',
    ma_market: 'MI0001',
    mo_ta: 'Market in túi PE trắng 30x40',
    link_file: 'https://drive.google.com/file/d/sample-mi0001',
    id_nguoi_ve: '1',
    trang_thai: MARKET_IN_STATUS.CHO_DUYET,
    ngay_hieu_luc: null,
    id_nguoi_duyet: null,
    tg_duyet: null,
    ten_khach_hang: 'Công ty TNHH Minh Phát',
    ma_khach_hang: 'KH0001',
    ten_nguoi_ve: 'NV Demo',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '2',
    thu_tu: 2,
    id_khach_hang: '1',
    ma_san_pham: 'SP-BAG-002',
    ma_market: 'MI0002',
    mo_ta: 'Market in túi zipper xanh',
    link_file: 'https://drive.google.com/file/d/sample-mi0002',
    id_nguoi_ve: '1',
    trang_thai: MARKET_IN_STATUS.DA_DUYET,
    ngay_hieu_luc: '2026-06-01',
    id_nguoi_duyet: '2',
    tg_duyet: ts(),
    ten_khach_hang: 'Công ty TNHH Minh Phát',
    ma_khach_hang: 'KH0001',
    ten_nguoi_ve: 'NV Demo',
    ten_nguoi_duyet: 'NV Duyệt',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '3',
    thu_tu: 3,
    id_khach_hang: '2',
    ma_san_pham: 'SP-FILM-010',
    ma_market: 'MI0003',
    mo_ta: 'Market in màng thổi 2 lớp',
    link_file: null,
    id_nguoi_ve: null,
    trang_thai: MARKET_IN_STATUS.CHO_DUYET,
    ngay_hieu_luc: null,
    id_nguoi_duyet: null,
    tg_duyet: null,
    ten_khach_hang: 'Công ty CP Xây dựng Đại Nam',
    ma_khach_hang: 'KH0002',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '4',
    thu_tu: 4,
    id_khach_hang: '3',
    ma_san_pham: 'SP-CUT-003',
    ma_market: 'MI0005',
    mo_ta: 'Market in ống cắt 50mm',
    link_file: null,
    id_nguoi_ve: '1',
    trang_thai: MARKET_IN_STATUS.NGUNG_AP_DUNG,
    ngay_hieu_luc: '2025-12-01',
    id_nguoi_duyet: null,
    tg_duyet: null,
    ten_khach_hang: 'Cửa hàng VLXD Hòa Bình',
    ma_khach_hang: 'KH0003',
    ten_nguoi_ve: 'NV Demo',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const repo = createRepository<MarketIn>({
  tableName: 'sx_market_in',
  mockData: MOCK_MARKET_IN,
  delay: 300,
});

async function enrichMockNames(item: MarketIn): Promise<MarketIn> {
  const [customers, employees] = await Promise.all([
    getKhachHangList(),
    getEmployees({ limit: 100, offset: 0 }),
  ]);
  const customer = customers.find((c) => c.id === item.id_khach_hang);
  const artist = employees.find((e) => e.id === item.id_nguoi_ve);
  const approver = employees.find((e) => e.id === item.id_nguoi_duyet);
  const creator = employees.find((e) => e.id === item.nguoi_tao);
  return {
    ...item,
    ten_khach_hang: customer?.ten_khach_hang ?? item.ten_khach_hang ?? null,
    ma_khach_hang: customer?.ma_khach_hang ?? item.ma_khach_hang ?? null,
    ten_nguoi_ve: artist?.ho_ten ?? item.ten_nguoi_ve ?? null,
    ten_nguoi_duyet: approver?.ho_ten ?? item.ten_nguoi_duyet ?? null,
    ten_nguoi_tao: creator?.ho_ten ?? item.ten_nguoi_tao ?? null,
  };
}

export async function getMarketInList(): Promise<MarketIn[]> {
  if (isApi()) return apiGetMarketInList();
  const items = await repo.getAll();
  return Promise.all(items.map(enrichMockNames));
}

const MA_PREFIX = 'MI';
const MA_PAD = 4;

export async function getNextMaMarket(): Promise<string> {
  if (isApi()) return apiGetNextMaMarket();
  const items = await repo.getAll();
  const re = new RegExp(`^${MA_PREFIX}(\\d+)$`);
  let max = 0;
  for (const item of items) {
    const m = re.exec(item.ma_market);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${MA_PREFIX}${String(max + 1).padStart(MA_PAD, '0')}`;
}

export async function createMarketIn(data: MarketInFormValues): Promise<MarketIn> {
  if (isApi()) return apiCreateMarketIn(data);
  const now = ts();
  const inserted = await repo.insert({
    thu_tu: data.thu_tu,
    id_khach_hang: data.id_khach_hang,
    ma_san_pham: data.ma_san_pham,
    ma_market: data.ma_market,
    mo_ta: data.mo_ta ?? null,
    link_file: data.link_file ?? null,
    id_nguoi_ve: data.id_nguoi_ve ?? null,
    trang_thai: MARKET_IN_STATUS.CHO_DUYET,
    ngay_hieu_luc: data.ngay_hieu_luc ?? null,
    id_nguoi_duyet: null,
    tg_duyet: null,
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
  return enrichMockNames(inserted);
}

export async function updateMarketIn(
  id: string,
  data: MarketInFormValues,
): Promise<MarketIn> {
  if (isApi()) return apiUpdateMarketIn(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('printMarket.title'));
  const updated = await repo.update(id, {
    thu_tu: data.thu_tu,
    id_khach_hang: data.id_khach_hang,
    ma_san_pham: data.ma_san_pham,
    ma_market: data.ma_market,
    mo_ta: data.mo_ta ?? null,
    link_file: data.link_file ?? null,
    id_nguoi_ve: data.id_nguoi_ve ?? null,
    ngay_hieu_luc: data.ngay_hieu_luc ?? null,
    tg_cap_nhat: ts(),
  });
  return enrichMockNames(updated);
}

export async function approveMarketIn(id: string): Promise<MarketIn> {
  if (isApi()) return apiApproveMarketIn(id);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('printMarket.title'));
  const now = ts();
  const updated = await repo.update(id, {
    trang_thai: MARKET_IN_STATUS.DA_DUYET,
    id_nguoi_duyet: getCurrentEmployeeId(),
    tg_duyet: now,
    tg_cap_nhat: now,
  });
  return enrichMockNames(updated);
}

export async function suspendMarketIn(id: string): Promise<MarketIn> {
  if (isApi()) return apiSuspendMarketIn(id);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('printMarket.title'));
  const updated = await repo.update(id, {
    trang_thai: MARKET_IN_STATUS.NGUNG_AP_DUNG,
    tg_cap_nhat: ts(),
  });
  return enrichMockNames(updated);
}

export async function deleteMarketInList(ids: string[]): Promise<void> {
  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeleteMarketIn(id)));
    return;
  }
  await repo.remove(ids);
}

export async function importMarketIn(
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> {
  const [customers, employees] = await Promise.all([
    getKhachHangList(),
    getAllEmployeesForLookup(),
  ]);
  const customerByMa = new Map(
    customers.map((c) => [c.ma_khach_hang.trim().toLowerCase(), c.id]),
  );
  const employeeByName = new Map(
    employees.map((e) => [e.ho_ten.trim().toLowerCase(), e.id]),
  );

  const buildPayload = (row: Record<string, unknown>): MarketInFormValues => {
    const maKh = String(row.ma_khach_hang ?? '').trim().toLowerCase();
    const idKhachHang = customerByMa.get(maKh);
    if (!idKhachHang) throw new Error(txt('printMarket.validation.customerRequired'));

    const artistName = String(row.ten_nguoi_ve ?? '').trim().toLowerCase();
    const idNguoiVe = artistName ? (employeeByName.get(artistName) ?? null) : null;

    return parseForImport(marketInSchema, {
      thu_tu: Number(row.thu_tu ?? 0),
      id_khach_hang: idKhachHang,
      ma_san_pham: String(row.ma_san_pham ?? '').trim(),
      ma_market: String(row.ma_market ?? '').trim(),
      mo_ta: row.mo_ta == null ? null : String(row.mo_ta),
      link_file: row.link_file == null ? null : String(row.link_file),
      id_nguoi_ve: idNguoiVe,
      ngay_hieu_luc: row.ngay_hieu_luc == null ? null : String(row.ngay_hieu_luc),
    });
  };

  const postChunk = async (items: MarketInFormValues[]): Promise<BulkImportResult> => {
    if (isApi()) return apiImportMarketIn(items);
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createMarketIn(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildPayload, postChunk, options);
}

export function getMarketInStatusLabel(status: string): string {
  return (
    MARKET_IN_STATUS_LABELS[status as keyof typeof MARKET_IN_STATUS_LABELS] ??
    status
  );
}
