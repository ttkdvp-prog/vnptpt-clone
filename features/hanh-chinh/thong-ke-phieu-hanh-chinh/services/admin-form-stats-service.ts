import { isApi } from '@/lib/data/config';
import {
  apiGetAdminFormStatsAggregates,
  apiGetPhieuHanhChinhPageFiltered,
  type AdminFormStatsQueryParams,
} from '@/lib/api/hanh-chinh-phieu';
import type { PhieuHanhChinh } from '@/features/hanh-chinh/phieu-hanh-chinh/core/types';
import { PHIEU_HANH_CHINH_STATUS } from '@/features/hanh-chinh/phieu-hanh-chinh/core/types';
import { computeSoNgay } from '@/features/hanh-chinh/phieu-hanh-chinh/utils/compute-so-ngay';
import { getPhieuHanhChinhList } from '@/features/hanh-chinh/phieu-hanh-chinh/services/phieu-hanh-chinh-service';
import type { AdminFormStatsAggregates } from '../core/stats-types';

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function overlaps(
  tuNgay: string,
  denNgay: string,
  from?: string,
  to?: string,
): boolean {
  const tu = dateOnly(tuNgay);
  const den = dateOnly(denNgay);
  if (to && tu > dateOnly(to)) return false;
  if (from && den < dateOnly(from)) return false;
  return true;
}

function filterMock(
  items: PhieuHanhChinh[],
  params?: AdminFormStatsQueryParams,
): PhieuHanhChinh[] {
  return items.filter((item) => {
    if (
      params?.ma_phieu?.length &&
      !params.ma_phieu.includes(item.ma_phieu)
    ) {
      return false;
    }
    if (params?.trang_thai?.length && !params.trang_thai.includes(item.trang_thai)) {
      return false;
    }
    if (
      params?.id_nhan_vien?.length &&
      !params.id_nhan_vien.includes(item.id_nhan_vien)
    ) {
      return false;
    }
    if (
      params?.id_phong_ban?.length &&
      (item.id_phong_ban == null || !params.id_phong_ban.includes(item.id_phong_ban))
    ) {
      return false;
    }
    if (params?.from || params?.to) {
      if (!overlaps(item.tu_ngay, item.den_ngay, params.from, params.to)) return false;
    }
    return true;
  });
}

function aggregateMock(items: PhieuHanhChinh[]): AdminFormStatsAggregates {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const byTypeMap = new Map<string, { id: string; name: string; count: number }>();
  const byStatusMap = new Map<string, number>();
  const byDeptMap = new Map<string, { id: string | null; name: string; count: number }>();
  const typeSummaryMap = new Map<
    string,
    {
      id: string;
      name: string;
      total: number;
      da_duyet: number;
      cho_duyet: number;
      tu_choi: number;
      tong_ngay: number;
    }
  >();

  let da_duyet = 0;
  let cho_duyet = 0;
  let tu_choi = 0;
  let tong_ngay = 0;
  let createdThisMonth = 0;
  let createdPrevMonth = 0;

  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const byMonthMap = Object.fromEntries(months.map((m) => [m, 0]));

  for (const item of items) {
    const typeId = item.ma_phieu;
    const typeName = item.ten_loai_phieu ?? item.ma_phieu ?? typeId;
    const t = byTypeMap.get(typeId) ?? { id: typeId, name: typeName, count: 0 };
    t.count++;
    byTypeMap.set(typeId, t);

    byStatusMap.set(item.trang_thai, (byStatusMap.get(item.trang_thai) ?? 0) + 1);

    const deptKey = item.id_phong_ban ?? '__none__';
    const d =
      byDeptMap.get(deptKey) ??
      {
        id: item.id_phong_ban ?? null,
        name: item.ten_phong_ban ?? (item.id_phong_ban ? item.id_phong_ban : 'Chưa phân bổ'),
        count: 0,
      };
    d.count++;
    byDeptMap.set(deptKey, d);

    const soNgay = computeSoNgay(item.tu_ngay, item.den_ngay);
    const isApproved = item.trang_thai === PHIEU_HANH_CHINH_STATUS.DA_DUYET;
    const isPending =
      item.trang_thai === PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET ||
      item.trang_thai === PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET;
    const isRejected = item.trang_thai === PHIEU_HANH_CHINH_STATUS.TU_CHOI;

    if (isApproved) {
      da_duyet++;
      tong_ngay += soNgay;
    } else if (isPending) {
      cho_duyet++;
    } else if (isRejected) {
      tu_choi++;
    }

    const created = new Date(item.tg_tao);
    if (created >= thisMonthStart) createdThisMonth++;
    else if (created >= prevMonthStart && created <= prevMonthEnd) createdPrevMonth++;

    const mk = monthKey(item.tu_ngay);
    if (mk in byMonthMap) {
      byMonthMap[mk] = (byMonthMap[mk] ?? 0) + 1;
    }

    let summary = typeSummaryMap.get(typeId);
    if (!summary) {
      summary = {
        id: typeId,
        name: typeName,
        total: 0,
        da_duyet: 0,
        cho_duyet: 0,
        tu_choi: 0,
        tong_ngay: 0,
      };
      typeSummaryMap.set(typeId, summary);
    }
    summary.total++;
    if (isApproved) {
      summary.da_duyet++;
      summary.tong_ngay += soNgay;
    } else if (isPending) {
      summary.cho_duyet++;
    } else if (isRejected) {
      summary.tu_choi++;
    }
  }

  return {
    kpis: {
      total: items.length,
      da_duyet,
      cho_duyet,
      tu_choi,
      tong_ngay,
      typeCount: byTypeMap.size,
      createdThisMonth,
      createdPrevMonth,
    },
    byType: [...byTypeMap.values()].sort((a, b) => b.count - a.count),
    byStatus: [...byStatusMap.entries()].map(([key, count]) => ({ key, count })),
    byDepartment: [...byDeptMap.values()].sort((a, b) => b.count - a.count),
    byMonth: months.map((month) => ({ month, count: byMonthMap[month] ?? 0 })),
    typeSummary: [...typeSummaryMap.values()]
      .map((row) => ({
        ...row,
        avg_ngay:
          row.da_duyet > 0
            ? Math.round((row.tong_ngay / row.da_duyet) * 100) / 100
            : 0,
      }))
      .sort((a, b) => b.total - a.total),
  };
}

export async function getAdminFormStatsAggregates(
  params?: AdminFormStatsQueryParams,
): Promise<AdminFormStatsAggregates> {
  if (isApi()) return apiGetAdminFormStatsAggregates(params);
  const all = await getPhieuHanhChinhList();
  return aggregateMock(filterMock(all, params));
}

export async function getAdminFormStatsDrillPage(params: {
  limit?: number;
  offset?: number;
  ma_phieu?: string[];
  trang_thai?: string[];
  id_phong_ban?: string[];
  id_nhan_vien?: string[];
  from?: string;
  to?: string;
}): Promise<{ items: PhieuHanhChinh[]; total: number }> {
  if (isApi()) {
    return apiGetPhieuHanhChinhPageFiltered({
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
      orderBy: 'tu_ngay',
      ascending: false,
      ma_phieu: params.ma_phieu,
      trang_thai: params.trang_thai,
      id_phong_ban: params.id_phong_ban,
      id_nhan_vien: params.id_nhan_vien,
      from: params.from,
      to: params.to,
    });
  }
  const all = await getPhieuHanhChinhList();
  const filtered = filterMock(all, params);
  const offset = params.offset ?? 0;
  const limit = params.limit ?? 100;
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}
