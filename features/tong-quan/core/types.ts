export interface TvPersonRow {
  id: string;
  ho_ten: string;
  anh_dai_dien?: string;
  ten_phong_ban?: string | null;
  ten_loai_phieu?: string | null;
  ma_phieu?: string;
}

export interface TvDeptBreakdownRow {
  id: string | null;
  name: string;
  workforce: number;
  onLeave: number;
  present: number;
}

export type TvRosterStatus = 'lam_viec' | 'cong_tac' | 'nghi';

export interface TvRosterRow {
  id: string;
  ho_ten: string;
  anh_dai_dien?: string;
  ten_chuc_vu?: string | null;
  ten_phong_ban?: string | null;
  status: TvRosterStatus;
  ghi_chu?: string | null;
}

export interface TvNhanSuSnapshot {
  date: string;
  workforce: number;
  presentToday: number;
  onLeave: number;
  onTrip: number;
  probation: number;
  roster: TvRosterRow[];
  byDepartment: TvDeptBreakdownRow[];
  birthdays: TvPersonRow[];
  fetchedAt: string;
}

export type TongQuanMode = 'embedded' | 'tv';
