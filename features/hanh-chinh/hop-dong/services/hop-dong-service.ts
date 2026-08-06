import type { HopDong } from '../core/types';
import { CONTRACT_STATUS, CONTRACT_TYPE, SALARY_MODE } from '../core/types';
import type { HopDongFormValues } from '../core/schema';
import { createRepository } from '@/lib/data/create-repository';
import { isApi } from '@/lib/data/config';
import {
  apiCreateHopDong,
  apiDeleteHopDong,
  apiGetHopDong,
  apiGetHopDongList,
  apiUpdateHopDong,
} from '@/lib/api/hanh-chinh-hop-dong';
import { getCurrentEmployeeId } from '@/lib/current-session-employee';
import { txt } from '@/lib/text';

const ts = () => new Date().toISOString();
const dateOnly = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const MOCK_CONTRACTS: HopDong[] = [
  {
    id: '1',
    loai_hop_dong: CONTRACT_TYPE.THU_VIEC,
    ma_hop_dong: 'HD-TV-0001',
    ngay_ky: dateOnly(-75),
    ngay_hieu_luc: dateOnly(-70),
    ngay_ket_thuc: dateOnly(-10),
    id_nhan_vien: '1',
    id_chuc_vu: '1',
    id_phong_ban: '1',
    ten_nhan_vien: 'Nguyễn Văn A',
    ten_chuc_vu: 'Nhân viên',
    ten_phong_ban: 'Phòng Hành chính',
    muc_luong: '85% lương chính thức — 8.500.000 đ/tháng',
    hinh_thuc_tra_luong: SALARY_MODE.THEO_THANG,
    che_do_khac: 'Hỗ trợ cơm trưa, gửi xe',
    noi_lam_viec: 'Văn phòng công ty',
    thoi_gian_lam_viec: 'Thứ 2 - Thứ 7, 08:00 - 17:00',
    luu_y_khac: 'Thử việc 60 ngày theo quy định',
    ghi_chu: 'Hợp đồng thử việc mẫu',
    trang_thai: CONTRACT_STATUS.DA_XONG,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '2',
    loai_hop_dong: CONTRACT_TYPE.CHINH_THUC,
    ma_hop_dong: 'HD-CT-0001',
    ngay_ky: dateOnly(-9),
    ngay_hieu_luc: dateOnly(-7),
    ngay_ket_thuc: null,
    id_nhan_vien: '1',
    id_chuc_vu: '1',
    id_phong_ban: '1',
    ten_nhan_vien: 'Nguyễn Văn A',
    ten_chuc_vu: 'Nhân viên',
    ten_phong_ban: 'Phòng Hành chính',
    muc_luong: '10.000.000 đ/tháng + phụ cấp',
    hinh_thuc_tra_luong: SALARY_MODE.THEO_THANG,
    che_do_khac: 'BHXH, BHYT, BHTN theo luật; thưởng lễ Tết',
    noi_lam_viec: 'Văn phòng công ty',
    thoi_gian_lam_viec: 'Thứ 2 - Thứ 7, 08:00 - 17:00',
    luu_y_khac: null,
    ghi_chu: 'Ký sau khi hoàn thành thử việc',
    trang_thai: CONTRACT_STATUS.DA_XONG,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: '3',
    loai_hop_dong: CONTRACT_TYPE.THU_VIEC,
    ma_hop_dong: 'HD-TV-0002',
    ngay_ky: dateOnly(0),
    ngay_hieu_luc: dateOnly(3),
    ngay_ket_thuc: dateOnly(63),
    id_nhan_vien: '2',
    id_chuc_vu: '2',
    id_phong_ban: '2',
    ten_nhan_vien: 'Trần Thị B',
    ten_chuc_vu: 'Công nhân',
    ten_phong_ban: 'Phòng Sản xuất',
    muc_luong: '7.650.000 đ/tháng',
    hinh_thuc_tra_luong: SALARY_MODE.THEO_THANG,
    che_do_khac: null,
    noi_lam_viec: 'Nhà máy sản xuất',
    thoi_gian_lam_viec: 'Theo ca sản xuất',
    luu_y_khac: 'Đang soạn — chờ bổ sung điều khoản',
    ghi_chu: null,
    trang_thai: CONTRACT_STATUS.CHUA_XONG,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const repo = createRepository<HopDong>({
  tableName: 'ns_hop_dong',
  mockData: MOCK_CONTRACTS,
  delay: 300,
});

export async function getHopDongList(): Promise<HopDong[]> {
  if (isApi()) return apiGetHopDongList();
  return repo.getAll();
}

export async function getHopDongById(id: string): Promise<HopDong | null> {
  if (isApi()) return apiGetHopDong(id);
  return repo.getById(id);
}

export async function createHopDong(data: HopDongFormValues): Promise<HopDong> {
  if (isApi()) return apiCreateHopDong(data);
  const now = ts();
  return repo.insert({
    loai_hop_dong: data.loai_hop_dong,
    ma_hop_dong: data.ma_hop_dong,
    ngay_ky: data.ngay_ky,
    ngay_hieu_luc: data.ngay_hieu_luc,
    ngay_ket_thuc: data.ngay_ket_thuc ?? null,
    id_nhan_vien: data.id_nhan_vien,
    id_chuc_vu: data.id_chuc_vu,
    id_phong_ban: data.id_phong_ban,
    muc_luong: data.muc_luong,
    hinh_thuc_tra_luong: data.hinh_thuc_tra_luong,
    che_do_khac: data.che_do_khac ?? null,
    noi_lam_viec: data.noi_lam_viec ?? null,
    thoi_gian_lam_viec: data.thoi_gian_lam_viec ?? null,
    luu_y_khac: data.luu_y_khac ?? null,
    ghi_chu: data.ghi_chu ?? null,
    trang_thai: data.trang_thai,
    nguoi_tao: getCurrentEmployeeId(),
    tg_tao: now,
    tg_cap_nhat: now,
  });
}

export async function updateHopDong(
  id: string,
  data: HopDongFormValues,
): Promise<HopDong> {
  if (isApi()) return apiUpdateHopDong(id, data);
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('contract.title'));
  return repo.update(id, {
    loai_hop_dong: data.loai_hop_dong,
    ma_hop_dong: data.ma_hop_dong,
    ngay_ky: data.ngay_ky,
    ngay_hieu_luc: data.ngay_hieu_luc,
    ngay_ket_thuc: data.ngay_ket_thuc ?? null,
    id_nhan_vien: data.id_nhan_vien,
    id_chuc_vu: data.id_chuc_vu,
    id_phong_ban: data.id_phong_ban,
    muc_luong: data.muc_luong,
    hinh_thuc_tra_luong: data.hinh_thuc_tra_luong,
    che_do_khac: data.che_do_khac ?? null,
    noi_lam_viec: data.noi_lam_viec ?? null,
    thoi_gian_lam_viec: data.thoi_gian_lam_viec ?? null,
    luu_y_khac: data.luu_y_khac ?? null,
    ghi_chu: data.ghi_chu ?? null,
    trang_thai: data.trang_thai,
    tg_cap_nhat: ts(),
  });
}

export async function deleteHopDongList(ids: string[]): Promise<void> {
  if (isApi()) {
    await Promise.all(ids.map((id) => apiDeleteHopDong(id)));
    return;
  }
  await repo.remove(ids);
}
