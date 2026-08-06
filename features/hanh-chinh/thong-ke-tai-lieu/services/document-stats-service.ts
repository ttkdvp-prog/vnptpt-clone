import { isApi } from '@/lib/data/config';
import {
  apiGetDanhSachTaiLieuPage,
  apiGetDocumentStatsAggregates,
  type DocumentStatsQueryParams,
} from '@/lib/api/hanh-chinh';
import type { DanhSachTaiLieu } from '@/features/hanh-chinh/danh-sach-tai-lieu/core/types';
import { DOCUMENT_STATUS } from '@/features/hanh-chinh/danh-sach-tai-lieu/core/types';
import { getDanhSachTaiLieuList } from '@/features/hanh-chinh/danh-sach-tai-lieu/services/danh-sach-tai-lieu-service';
import type { DocumentStatsAggregates } from '../core/stats-types';

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function inRange(iso: string, from?: string, to?: string): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (from && t < new Date(from).setHours(0, 0, 0, 0)) return false;
  if (to && t > new Date(to).setHours(23, 59, 59, 999)) return false;
  return true;
}

function filterMock(
  items: DanhSachTaiLieu[],
  params?: DocumentStatsQueryParams,
): DanhSachTaiLieu[] {
  return items.filter((item) => {
    if (
      params?.id_loai_tai_lieu?.length &&
      !params.id_loai_tai_lieu.includes(item.id_loai_tai_lieu)
    ) {
      return false;
    }
    if (params?.trang_thai?.length && !params.trang_thai.includes(item.trang_thai)) {
      return false;
    }
    if (
      params?.nguoi_tao?.length &&
      (item.nguoi_tao == null || !params.nguoi_tao.includes(item.nguoi_tao))
    ) {
      return false;
    }
    if (params?.from || params?.to) {
      if (!inRange(item.tg_tao, params.from, params.to)) return false;
    }
    return true;
  });
}

function aggregateMock(items: DanhSachTaiLieu[]): DocumentStatsAggregates {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const byTypeMap = new Map<string, { id: string; name: string; count: number }>();
  const byStatusMap = new Map<string, number>();
  const byCreatorMap = new Map<string, { id: string | null; name: string; count: number }>();
  const typeSummaryMap = new Map<
    string,
    {
      id: string;
      name: string;
      total: number;
      du_thao: number;
      hieu_luc: number;
      loi_thoi: number;
      cho_sua: number;
    }
  >();

  let du_thao = 0;
  let hieu_luc = 0;
  let loi_thoi = 0;
  let cho_sua = 0;
  let createdThisMonth = 0;
  let createdPrevMonth = 0;

  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const createdByMonthMap = Object.fromEntries(months.map((m) => [m, 0]));

  for (const item of items) {
    const typeId = item.id_loai_tai_lieu;
    const typeName = item.ten_loai_tai_lieu ?? typeId;
    const t = byTypeMap.get(typeId) ?? { id: typeId, name: typeName, count: 0 };
    t.count++;
    byTypeMap.set(typeId, t);

    byStatusMap.set(item.trang_thai, (byStatusMap.get(item.trang_thai) ?? 0) + 1);

    const creatorKey = item.nguoi_tao ?? '__none__';
    const c =
      byCreatorMap.get(creatorKey) ??
      {
        id: item.nguoi_tao ?? null,
        name: item.ten_nguoi_tao ?? item.nguoi_tao ?? 'Không xác định',
        count: 0,
      };
    c.count++;
    byCreatorMap.set(creatorKey, c);

    let summary = typeSummaryMap.get(typeId);
    if (!summary) {
      summary = {
        id: typeId,
        name: typeName,
        total: 0,
        du_thao: 0,
        hieu_luc: 0,
        loi_thoi: 0,
        cho_sua: 0,
      };
      typeSummaryMap.set(typeId, summary);
    }
    summary.total++;
    if (item.trang_thai === DOCUMENT_STATUS.DU_THAO) {
      summary.du_thao++;
      du_thao++;
    } else if (item.trang_thai === DOCUMENT_STATUS.HIEU_LUC) {
      summary.hieu_luc++;
      hieu_luc++;
    } else if (item.trang_thai === DOCUMENT_STATUS.LOI_THOI) {
      summary.loi_thoi++;
      loi_thoi++;
    } else if (item.trang_thai === DOCUMENT_STATUS.CHO_SUA) {
      summary.cho_sua++;
      cho_sua++;
    }

    const created = new Date(item.tg_tao);
    if (created >= thisMonthStart) createdThisMonth++;
    else if (created >= prevMonthStart && created <= prevMonthEnd) createdPrevMonth++;

    const mk = monthKey(item.tg_tao);
    if (mk in createdByMonthMap) {
      createdByMonthMap[mk] = (createdByMonthMap[mk] ?? 0) + 1;
    }
  }

  return {
    kpis: {
      total: items.length,
      du_thao,
      hieu_luc,
      loi_thoi,
      cho_sua,
      typeCount: byTypeMap.size,
      createdThisMonth,
      createdPrevMonth,
    },
    byType: [...byTypeMap.values()].sort((a, b) => b.count - a.count),
    byStatus: [...byStatusMap.entries()].map(([key, count]) => ({ key, count })),
    byCreator: [...byCreatorMap.values()].sort((a, b) => b.count - a.count),
    createdByMonth: months.map((month) => ({
      month,
      count: createdByMonthMap[month] ?? 0,
    })),
    typeSummary: [...typeSummaryMap.values()].sort((a, b) => b.total - a.total),
  };
}

export async function getDocumentStatsAggregates(
  params?: DocumentStatsQueryParams,
): Promise<DocumentStatsAggregates> {
  if (isApi()) return apiGetDocumentStatsAggregates(params);
  const all = await getDanhSachTaiLieuList();
  return aggregateMock(filterMock(all, params));
}

export async function getDocumentStatsDrillPage(params: {
  limit?: number;
  offset?: number;
  id_loai_tai_lieu?: string[];
  trang_thai?: string[];
  nguoi_tao?: string[];
  from?: string;
  to?: string;
}): Promise<{ items: DanhSachTaiLieu[]; total: number }> {
  if (isApi()) {
    return apiGetDanhSachTaiLieuPage({
      limit: params.limit ?? 100,
      offset: params.offset ?? 0,
      orderBy: 'tg_tao',
      ascending: false,
      id_loai_tai_lieu: params.id_loai_tai_lieu,
      trang_thai: params.trang_thai,
      nguoi_tao: params.nguoi_tao,
      from: params.from,
      to: params.to,
    });
  }
  const all = await getDanhSachTaiLieuList();
  const filtered = filterMock(all, params);
  const offset = params.offset ?? 0;
  const limit = params.limit ?? 100;
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}
