import dayjs from 'dayjs';
import { getEmployeesPage } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { getAdminFormStatsDrillPage } from '@/features/hanh-chinh/thong-ke-phieu-hanh-chinh/services/admin-form-stats-service';
import { PHIEU_HANH_CHINH_STATUS } from '@/features/hanh-chinh/phieu-hanh-chinh/core/types';
import type { PhieuHanhChinh } from '@/features/hanh-chinh/phieu-hanh-chinh/core/types';
import { getThongBaoList } from '@/features/hanh-chinh/thong-bao/services/thong-bao-service';
import type { ThongBao } from '@/features/hanh-chinh/thong-bao/core/types';
import { getTenLoaiPhieu } from '@/features/hanh-chinh/phieu-hanh-chinh/core/loai-phieu';
import {
  LEAVE_MA_PHIEU,
  PRESENCE_MA_PHIEU,
  TRIP_MA_PHIEU,
} from '../core/slides';
import type {
  TvDeptBreakdownRow,
  TvNhanSuSnapshot,
  TvPersonRow,
  TvRosterRow,
  TvRosterStatus,
} from '../core/types';

const PAGE_SIZE = 100;

const STATUS_SORT: Record<TvRosterStatus, number> = {
  nghi: 0,
  cong_tac: 1,
  lam_viec: 2,
};

async function fetchWorkforceEmployees(): Promise<Employee[]> {
  const items: Employee[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const page = await getEmployeesPage({
      limit: PAGE_SIZE,
      offset,
      orderBy: 'ho_ten',
      ascending: true,
      trang_thai: ['Đang làm việc', 'Thử việc'],
    });
    total = page.total;
    items.push(...page.items);
    offset += PAGE_SIZE;
    if (page.items.length === 0) break;
  }

  return items;
}

function isBirthdayToday(ngaySinh: string | null | undefined, today: dayjs.Dayjs): boolean {
  if (!ngaySinh) return false;
  const d = dayjs(ngaySinh);
  if (!d.isValid()) return false;
  return d.month() === today.month() && d.date() === today.date();
}

function buildDeptBreakdown(
  workforce: Employee[],
  leaveIds: Set<string>,
): TvDeptBreakdownRow[] {
  const map = new Map<string, TvDeptBreakdownRow>();

  for (const emp of workforce) {
    const key = emp.phong_ban_id ?? '__none__';
    const name = emp.ten_phong_ban?.trim() || 'Chưa gán phòng ban';
    let row = map.get(key);
    if (!row) {
      row = {
        id: emp.phong_ban_id,
        name,
        workforce: 0,
        onLeave: 0,
        present: 0,
      };
      map.set(key, row);
    }
    row.workforce += 1;
    if (leaveIds.has(emp.id)) {
      row.onLeave += 1;
    } else {
      row.present += 1;
    }
  }

  return [...map.values()].sort((a, b) => b.workforce - a.workforce);
}

function buildRoster(
  workforce: Employee[],
  leaveByEmp: Map<string, PhieuHanhChinh>,
  tripByEmp: Map<string, PhieuHanhChinh>,
): TvRosterRow[] {
  const rows: TvRosterRow[] = workforce.map((emp) => {
    const leave = leaveByEmp.get(emp.id);
    const trip = tripByEmp.get(emp.id);
    if (leave) {
      return {
        id: emp.id,
        ho_ten: emp.ho_ten,
        anh_dai_dien: emp.anh_dai_dien,
        ten_chuc_vu: emp.ten_chuc_vu,
        ten_phong_ban: emp.ten_phong_ban,
        status: 'nghi',
        ghi_chu: leave.ten_loai_phieu ?? getTenLoaiPhieu(leave.ma_phieu) ?? leave.ly_do,
      };
    }
    if (trip) {
      return {
        id: emp.id,
        ho_ten: emp.ho_ten,
        anh_dai_dien: emp.anh_dai_dien,
        ten_chuc_vu: emp.ten_chuc_vu,
        ten_phong_ban: emp.ten_phong_ban,
        status: 'cong_tac',
        ghi_chu: trip.ten_loai_phieu ?? getTenLoaiPhieu(trip.ma_phieu) ?? trip.ly_do,
      };
    }
    return {
      id: emp.id,
      ho_ten: emp.ho_ten,
      anh_dai_dien: emp.anh_dai_dien,
      ten_chuc_vu: emp.ten_chuc_vu,
      ten_phong_ban: emp.ten_phong_ban,
      status: 'lam_viec',
      ghi_chu: null,
    };
  });

  return rows.sort((a, b) => {
    const byStatus = STATUS_SORT[a.status] - STATUS_SORT[b.status];
    if (byStatus !== 0) return byStatus;
    return a.ho_ten.localeCompare(b.ho_ten, 'vi');
  });
}

/** Snapshot nhân sự cho slide TV (refetch mỗi phút). */
export async function getTvNhanSuSnapshot(dateIso?: string): Promise<TvNhanSuSnapshot> {
  const today = dateIso ? dayjs(dateIso) : dayjs();
  const date = today.format('YYYY-MM-DD');

  const [workforce, presencePage] = await Promise.all([
    fetchWorkforceEmployees(),
    getAdminFormStatsDrillPage({
      limit: 500,
      offset: 0,
      ma_phieu: [...PRESENCE_MA_PHIEU],
      trang_thai: [PHIEU_HANH_CHINH_STATUS.DA_DUYET],
      from: date,
      to: date,
    }),
  ]);

  const leaveMa = new Set<string>(LEAVE_MA_PHIEU);
  const tripMa = new Set<string>(TRIP_MA_PHIEU);

  const leaveByEmp = new Map<string, PhieuHanhChinh>();
  const tripByEmp = new Map<string, PhieuHanhChinh>();

  for (const phieu of presencePage.items) {
    const ma = phieu.ma_phieu?.toUpperCase() ?? '';
    if (leaveMa.has(ma)) {
      if (!leaveByEmp.has(phieu.id_nhan_vien)) leaveByEmp.set(phieu.id_nhan_vien, phieu);
    } else if (tripMa.has(ma)) {
      if (!tripByEmp.has(phieu.id_nhan_vien)) tripByEmp.set(phieu.id_nhan_vien, phieu);
    }
  }

  const leaveIds = new Set(leaveByEmp.keys());
  const tripIds = new Set(tripByEmp.keys());
  const awayIds = new Set([...leaveIds, ...tripIds]);

  const probation = workforce.filter((e) => e.trang_thai === 'Thử việc').length;
  const presentToday = workforce.filter((e) => !awayIds.has(e.id)).length;

  const birthdays: TvPersonRow[] = workforce
    .filter((e) => isBirthdayToday(e.ngay_sinh, today))
    .map((e) => ({
      id: e.id,
      ho_ten: e.ho_ten,
      anh_dai_dien: e.anh_dai_dien,
      ten_phong_ban: e.ten_phong_ban,
    }));

  return {
    date,
    workforce: workforce.length,
    presentToday,
    onLeave: leaveIds.size,
    onTrip: tripIds.size,
    probation,
    roster: buildRoster(workforce, leaveByEmp, tripByEmp),
    byDepartment: buildDeptBreakdown(workforce, leaveIds),
    birthdays,
    fetchedAt: new Date().toISOString(),
  };
}

export interface TvTickerItem {
  id: string;
  timeLabel: string;
  tieu_de: string;
  noi_dung: string;
}

function dateKey(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD');
}

/** Thông báo cho ticker: ưu tiên trong ngày, fallback 7 ngày gần nhất. */
export async function getTvTickerAnnouncements(): Promise<TvTickerItem[]> {
  const list = await getThongBaoList();
  const today = dayjs().format('YYYY-MM-DD');
  const weekAgo = dayjs().subtract(7, 'day').startOf('day');

  const sorted = [...list].sort(
    (a, b) => dayjs(b.tg_dang).valueOf() - dayjs(a.tg_dang).valueOf(),
  );

  let picked: ThongBao[] = sorted.filter((a) => dateKey(a.tg_dang) === today);
  if (picked.length === 0) {
    picked = sorted.filter((a) => !dayjs(a.tg_dang).isBefore(weekAgo));
  }

  return picked.slice(0, 20).map((a) => ({
    id: a.id,
    timeLabel: dayjs(a.tg_dang).format('HH:mm'),
    tieu_de: a.tieu_de,
    noi_dung: a.noi_dung.replace(/\s+/g, ' ').trim().slice(0, 120),
  }));
}
