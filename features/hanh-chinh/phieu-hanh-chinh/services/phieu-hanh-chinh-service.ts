import type { PhieuHanhChinh } from '../core/types';
import {
  PHIEU_BUOI,
  PHIEU_HANH_CHINH_STATUS,
  PHIEU_HANH_CHINH_STATUS_LABELS,
} from '../core/types';
import type { PhieuHanhChinhFormValues } from '../core/schema';
import { phieuHanhChinhSchema } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiApprovePhieuHcns,
  apiApprovePhieuQl,
  apiCancelPhieuHanhChinh,
  apiCreatePhieuHanhChinh,
  apiDeletePhieuHanhChinh,
  apiGetPhieuHanhChinhList,
  apiImportPhieuHanhChinh,
  apiRejectPhieuHanhChinh,
  apiUpdatePhieuHanhChinh,
} from '@/lib/api/hanh-chinh-phieu';
import { getTenLoaiPhieu, resolveMaLoaiPhieu } from '../core/loai-phieu';
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
import {
  isGlobalPermissionSuperUser,
  isModulePermissionAdmin,
} from '@/lib/permissions';

const ts = () => new Date().toISOString();
const MODULE_ID = 'hanh-chinh/phieu-hanh-chinh';

function canManageLocked(): boolean {
  return (
    isGlobalPermissionSuperUser() ||
    isModulePermissionAdmin(MODULE_ID)
  );
}

const MOCK_PHIEU: PhieuHanhChinh[] = [
  {
    id: '1',
    id_nhan_vien: '1',
    tu_ngay: '2026-07-10',
    buoi_bat_dau: PHIEU_BUOI.SANG,
    den_ngay: '2026-07-10',
    buoi_ket_thuc: PHIEU_BUOI.CHIEU,
    gio_bat_dau: null,
    gio_ket_thuc: null,
    ly_do: 'Xin nghỉ việc riêng',
    hinh_anh: [],
    trang_thai: PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET,
    id_ql_duyet: null,
    tg_ql_duyet: null,
    ghi_chu_ql: null,
    id_hcns_duyet: null,
    tg_hcns_duyet: null,
    ghi_chu_hcns: null,
    ly_do_tu_choi: null,
    ten_loai_phieu: 'Xin nghỉ',
    ma_phieu: 'XN',
    ten_nhan_vien: 'NV Demo',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
    nguoi_tao: '1',
  },
  {
    id: '2',
    id_nhan_vien: '1',
    tu_ngay: '2026-07-12',
    buoi_bat_dau: PHIEU_BUOI.SANG,
    den_ngay: '2026-07-14',
    buoi_ket_thuc: PHIEU_BUOI.CHIEU,
    gio_bat_dau: null,
    gio_ket_thuc: null,
    ly_do: 'Công tác khách hàng miền Nam',
    hinh_anh: [],
    trang_thai: PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET,
    id_ql_duyet: '2',
    tg_ql_duyet: ts(),
    ghi_chu_ql: 'QL đồng ý',
    id_hcns_duyet: null,
    tg_hcns_duyet: null,
    ghi_chu_hcns: null,
    ly_do_tu_choi: null,
    ten_loai_phieu: 'Công tác',
    ma_phieu: 'CT',
    ten_nhan_vien: 'NV Demo',
    ten_ql_duyet: 'NV Duyệt',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
    nguoi_tao: '1',
  },
  {
    id: '3',
    id_nhan_vien: '2',
    tu_ngay: '2026-07-08',
    buoi_bat_dau: PHIEU_BUOI.SANG,
    den_ngay: '2026-07-09',
    buoi_ket_thuc: PHIEU_BUOI.SANG,
    gio_bat_dau: null,
    gio_ket_thuc: null,
    ly_do: 'Nghỉ bệnh có giấy xác nhận',
    hinh_anh: [],
    trang_thai: PHIEU_HANH_CHINH_STATUS.DA_DUYET,
    id_ql_duyet: '2',
    tg_ql_duyet: ts(),
    ghi_chu_ql: 'QL đồng ý',
    id_hcns_duyet: '3',
    tg_hcns_duyet: ts(),
    ghi_chu_hcns: 'HCNS xác nhận',
    ly_do_tu_choi: null,
    ten_loai_phieu: 'Nghỉ bệnh',
    ma_phieu: 'NB',
    ten_nhan_vien: 'NV Duyệt',
    ten_ql_duyet: 'NV Duyệt',
    ten_hcns_duyet: 'NV HCNS',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
    nguoi_tao: '2',
  },
  {
    id: '4',
    id_nhan_vien: '1',
    tu_ngay: '2026-07-15',
    buoi_bat_dau: PHIEU_BUOI.DEM,
    den_ngay: '2026-07-15',
    buoi_ket_thuc: PHIEU_BUOI.DEM,
    gio_bat_dau: '22:00',
    gio_ket_thuc: '06:00',
    ly_do: 'Điều chỉnh công ca đêm',
    hinh_anh: [],
    trang_thai: PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET,
    id_ql_duyet: null,
    tg_ql_duyet: null,
    ghi_chu_ql: null,
    id_hcns_duyet: null,
    tg_hcns_duyet: null,
    ghi_chu_hcns: null,
    ly_do_tu_choi: null,
    ten_loai_phieu: 'Điều chỉnh công',
    ma_phieu: 'DC',
    ten_nhan_vien: 'NV Demo',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
    nguoi_tao: '1',
  },
  {
    id: '5',
    id_nhan_vien: '2',
    tu_ngay: '2026-06-20',
    buoi_bat_dau: PHIEU_BUOI.CHIEU,
    den_ngay: '2026-06-22',
    buoi_ket_thuc: PHIEU_BUOI.SANG,
    gio_bat_dau: null,
    gio_ket_thuc: null,
    ly_do: 'Xin nghỉ — trùng lịch',
    hinh_anh: [],
    trang_thai: PHIEU_HANH_CHINH_STATUS.TU_CHOI,
    id_ql_duyet: '2',
    tg_ql_duyet: ts(),
    ghi_chu_ql: 'Không đủ điều kiện',
    id_hcns_duyet: null,
    tg_hcns_duyet: null,
    ghi_chu_hcns: null,
    ly_do_tu_choi: 'Không đủ điều kiện',
    ten_loai_phieu: 'Xin nghỉ',
    ma_phieu: 'XN',
    ten_nhan_vien: 'NV Duyệt',
    ten_ql_duyet: 'NV Duyệt',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
    nguoi_tao: '2',
  },
];

const repo = createRepository<PhieuHanhChinh>({
  tableName: 'cong_luong_phieu_hanh_chinh',
  mockData: MOCK_PHIEU,
  delay: 300,
});

async function enrichMockNames(item: PhieuHanhChinh): Promise<PhieuHanhChinh> {
  const employees = await getEmployees({ limit: 100, offset: 0 });
  const nv = employees.find((e) => e.id === item.id_nhan_vien);
  const ql = employees.find((e) => e.id === item.id_ql_duyet);
  const hcns = employees.find((e) => e.id === item.id_hcns_duyet);
  const creator = employees.find((e) => e.id === item.nguoi_tao);
  return {
    ...item,
    ten_loai_phieu: getTenLoaiPhieu(item.ma_phieu) ?? item.ten_loai_phieu ?? null,
    ten_nhan_vien: nv?.ho_ten ?? item.ten_nhan_vien ?? null,
    id_phong_ban: nv?.phong_ban_id ?? item.id_phong_ban ?? null,
    ten_phong_ban: nv?.ten_phong_ban ?? item.ten_phong_ban ?? null,
    ten_ql_duyet: ql?.ho_ten ?? item.ten_ql_duyet ?? null,
    ten_hcns_duyet: hcns?.ho_ten ?? item.ten_hcns_duyet ?? null,
    ten_nguoi_tao: creator?.ho_ten ?? item.ten_nguoi_tao ?? null,
  };
}

export async function getPhieuHanhChinhList(): Promise<PhieuHanhChinh[]> {
  if (isApi()) return apiGetPhieuHanhChinhList();
  const items = await repo.getAll();
  return Promise.all(items.map(enrichMockNames));
}

export async function createPhieuHanhChinh(
  data: PhieuHanhChinhFormValues,
): Promise<PhieuHanhChinh> {
  if (isApi()) return apiCreatePhieuHanhChinh(data);
  const now = ts();
  const inserted = await repo.insert({
    ...data,
    hinh_anh: data.hinh_anh ?? [],
    trang_thai: PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET,
    id_ql_duyet: null,
    tg_ql_duyet: null,
    ghi_chu_ql: null,
    id_hcns_duyet: null,
    tg_hcns_duyet: null,
    ghi_chu_hcns: null,
    ly_do_tu_choi: null,
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
  return enrichMockNames(inserted);
}

export async function updatePhieuHanhChinh(
  id: string,
  data: PhieuHanhChinhFormValues,
): Promise<PhieuHanhChinh> {
  if (isApi()) return apiUpdatePhieuHanhChinh(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('adminForm.title'));
  if (
    existing.trang_thai !== PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET &&
    !(
      (existing.trang_thai === PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET ||
        existing.trang_thai === PHIEU_HANH_CHINH_STATUS.DA_DUYET) &&
      canManageLocked()
    )
  ) {
    throw new Error('Trạng thái phiếu không cho phép chỉnh sửa');
  }
  const updated = await repo.update(id, {
    ...data,
    hinh_anh: data.hinh_anh ?? [],
    tg_cap_nhat: ts(),
  });
  return enrichMockNames(updated);
}

export async function approvePhieuQl(
  id: string,
  ghiChu?: string | null,
): Promise<PhieuHanhChinh> {
  if (isApi()) return apiApprovePhieuQl(id, ghiChu);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('adminForm.title'));
  const now = ts();
  const updated = await repo.update(id, {
    trang_thai: PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET,
    id_ql_duyet: getCurrentEmployeeId(),
    tg_ql_duyet: now,
    ghi_chu_ql: ghiChu?.trim() || null,
    tg_cap_nhat: now,
  });
  return enrichMockNames(updated);
}

export async function approvePhieuHcns(
  id: string,
  ghiChu?: string | null,
): Promise<PhieuHanhChinh> {
  if (isApi()) return apiApprovePhieuHcns(id, ghiChu);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('adminForm.title'));
  const now = ts();
  const updated = await repo.update(id, {
    trang_thai: PHIEU_HANH_CHINH_STATUS.DA_DUYET,
    id_hcns_duyet: getCurrentEmployeeId(),
    tg_hcns_duyet: now,
    ghi_chu_hcns: ghiChu?.trim() || null,
    tg_cap_nhat: now,
  });
  return enrichMockNames(updated);
}

export async function rejectPhieuHanhChinh(
  id: string,
  lyDoTuChoi: string,
): Promise<PhieuHanhChinh> {
  if (isApi()) return apiRejectPhieuHanhChinh(id, lyDoTuChoi);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('adminForm.title'));
  const now = ts();
  const isQl = existing.trang_thai === PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET;
  const updated = await repo.update(id, {
    trang_thai: PHIEU_HANH_CHINH_STATUS.TU_CHOI,
    ly_do_tu_choi: lyDoTuChoi.trim(),
    ...(isQl
      ? {
          id_ql_duyet: getCurrentEmployeeId(),
          tg_ql_duyet: now,
          ghi_chu_ql: lyDoTuChoi.trim(),
        }
      : {
          id_hcns_duyet: getCurrentEmployeeId(),
          tg_hcns_duyet: now,
          ghi_chu_hcns: lyDoTuChoi.trim(),
        }),
    tg_cap_nhat: now,
  });
  return enrichMockNames(updated);
}

export async function cancelPhieuHanhChinh(id: string): Promise<PhieuHanhChinh> {
  if (isApi()) return apiCancelPhieuHanhChinh(id);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('adminForm.title'));
  const me = getCurrentEmployeeId();
  if (existing.trang_thai !== PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET) {
    throw new Error('Chỉ hủy được phiếu đang chờ QL duyệt');
  }
  const meId = me != null ? String(me) : '';
  if (
    !meId ||
    (meId !== String(existing.id_nhan_vien) &&
      meId !== String(existing.nguoi_tao ?? ''))
  ) {
    throw new Error('Chỉ nhân sự liên quan mới được hủy phiếu');
  }
  const updated = await repo.update(id, {
    trang_thai: PHIEU_HANH_CHINH_STATUS.DA_HUY,
    tg_cap_nhat: ts(),
  });
  return enrichMockNames(updated);
}

export async function deletePhieuHanhChinhList(ids: string[]): Promise<void> {
  const items = await getPhieuHanhChinhList();
  const includesLocked = items.some(
    (item) =>
      ids.includes(item.id) &&
      (item.trang_thai === PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET ||
        item.trang_thai === PHIEU_HANH_CHINH_STATUS.DA_DUYET),
  );
  if (includesLocked && !canManageLocked()) {
    throw new Error(
      'Chỉ cấp bậc 1 hoặc quản trị module được xóa phiếu chờ HCNS/đã duyệt',
    );
  }

  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeletePhieuHanhChinh(id)));
    return;
  }
  await repo.remove(ids);
}

export async function importPhieuHanhChinh(
  rows: ImportBatchRow[],
  options?: { onProgress?: (done: number, total: number) => void },
): Promise<ImportResult> {
  const employees = await getAllEmployeesForLookup();
  const employeeByName = new Map(
    employees.map((e) => [e.ho_ten.trim().toLowerCase(), e.id]),
  );

  const buildPayload = (row: Record<string, unknown>): PhieuHanhChinhFormValues => {
    const ma = resolveMaLoaiPhieu(String(row.ma_phieu ?? ''));
    if (!ma) throw new Error(txt('adminForm.validation.typeRequired'));

    const nvName = String(row.ten_nhan_vien ?? '').trim().toLowerCase();
    const idNv = employeeByName.get(nvName);
    if (!idNv) throw new Error(txt('adminForm.validation.employeeRequired'));

    return parseForImport(phieuHanhChinhSchema, {
      ma_phieu: ma,
      id_nhan_vien: idNv,
      tu_ngay: String(row.tu_ngay ?? '').trim(),
      buoi_bat_dau: String(row.buoi_bat_dau ?? 'sang').trim().toLowerCase(),
      den_ngay: String(row.den_ngay ?? '').trim(),
      buoi_ket_thuc: String(row.buoi_ket_thuc ?? 'chieu').trim().toLowerCase(),
      gio_bat_dau: row.gio_bat_dau == null ? null : String(row.gio_bat_dau),
      gio_ket_thuc: row.gio_ket_thuc == null ? null : String(row.gio_ket_thuc),
      ly_do: row.ly_do == null ? null : String(row.ly_do),
      hinh_anh: [],
    });
  };

  const postChunk = async (
    items: PhieuHanhChinhFormValues[],
  ): Promise<BulkImportResult> => {
    if (isApi()) return apiImportPhieuHanhChinh(items);
    const errors: BulkImportResult['errors'] = [];
    let created = 0;
    for (let index = 0; index < items.length; index++) {
      try {
        await createPhieuHanhChinh(items[index]!);
        created++;
      } catch (err) {
        errors.push({ index, message: err instanceof Error ? err.message : String(err) });
      }
    }
    return { created, errors };
  };

  return runChunkedImport(rows, buildPayload, postChunk, options);
}

export function getPhieuHanhChinhStatusLabel(status: string): string {
  return (
    PHIEU_HANH_CHINH_STATUS_LABELS[status as keyof typeof PHIEU_HANH_CHINH_STATUS_LABELS] ??
    status
  );
}
