import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import type { CompanyInfo } from '@/features/he-thong/thong-tin-cong-ty/core/cong-ty-map';
import { formatDate } from '@/lib/utils';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE,
  CONTRACT_TYPE_LABELS,
  SALARY_MODE_LABELS,
  type ContractStatus,
  type ContractType,
  type HopDong,
  type SalaryMode,
} from '../core/types';

const BLANK = '……';

function dash(value: string | null | undefined): string {
  const v = value?.trim();
  return v ? v : BLANK;
}

function splitSignDate(iso: string | null | undefined): {
  ngay: string;
  thang: string;
  nam: string;
} {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    return { ngay: '…', thang: '…', nam: '…' };
  }
  const [y, m, d] = iso.slice(0, 10).split('-');
  return { ngay: d ?? '…', thang: m ?? '…', nam: y ?? '…' };
}

export interface ContractLegalViewModel {
  ma_hop_dong: string;
  loai_hop_dong_ten: string;
  ngay_ky_ngay: string;
  ngay_ky_thang: string;
  ngay_ky_nam: string;
  dia_diem_ky: string;
  ten_cong_ty: string;
  dia_chi_cong_ty: string;
  mst_cong_ty: string;
  nguoi_dai_dien_cong_ty: string;
  chuc_vu_nguoi_dai_dien: string;
  dien_thoai_cong_ty: string;
  ho_ten_nhan_vien: string;
  ngay_sinh_nhan_vien: string;
  gioi_tinh_nhan_vien: string;
  cccd_nhan_vien: string;
  ngay_cap_cccd: string;
  noi_cap_cccd: string;
  dia_chi_thuong_tru: string;
  dia_chi_hien_tai: string;
  so_dien_thoai_nhan_vien: string;
  so_so_bhxh: string;
  ngay_hieu_luc: string;
  ngay_ket_thuc_hoac_khong_xac_dinh: string;
  ten_chuc_vu: string;
  ten_phong_ban: string;
  noi_lam_viec: string;
  thoi_gian_lam_viec: string;
  muc_luong: string;
  hinh_thuc_tra_luong_ten: string;
  che_do_khac: string;
  luu_y_khac: string;
  trang_thai_ten: string;
  tg_tao: string;
}

export function buildContractLegalViewModel(
  contract: HopDong,
  employee: Employee | null | undefined,
  company: CompanyInfo,
): ContractLegalViewModel {
  const typeKey = contract.loai_hop_dong as ContractType;
  const loaiTen =
    CONTRACT_TYPE_LABELS[typeKey] ??
    (contract.loai_hop_dong === CONTRACT_TYPE.THU_VIEC ? 'Thử việc' : 'Chính thức');

  const salaryMode =
    SALARY_MODE_LABELS[contract.hinh_thuc_tra_luong as SalaryMode] ??
    contract.hinh_thuc_tra_luong;

  const statusLabel =
    CONTRACT_STATUS_LABELS[contract.trang_thai as ContractStatus] ?? contract.trang_thai;

  const signParts = splitSignDate(contract.ngay_ky);
  const diaDiemKy = dash(company.signingPlace || company.address);

  return {
    ma_hop_dong: dash(contract.ma_hop_dong),
    loai_hop_dong_ten: loaiTen,
    ngay_ky_ngay: signParts.ngay,
    ngay_ky_thang: signParts.thang,
    ngay_ky_nam: signParts.nam,
    dia_diem_ky: diaDiemKy,
    ten_cong_ty: dash(company.companyName),
    dia_chi_cong_ty: dash(company.address),
    mst_cong_ty: dash(company.taxId),
    nguoi_dai_dien_cong_ty: dash(company.representative),
    chuc_vu_nguoi_dai_dien: dash(company.representativeTitle),
    dien_thoai_cong_ty: dash(company.phone),
    ho_ten_nhan_vien: dash(employee?.ho_ten ?? contract.ten_nhan_vien),
    ngay_sinh_nhan_vien: employee?.ngay_sinh ? formatDate(employee.ngay_sinh) : BLANK,
    gioi_tinh_nhan_vien: dash(employee?.gioi_tinh),
    cccd_nhan_vien: dash(employee?.so_cccd),
    ngay_cap_cccd: employee?.ngay_cap_cccd ? formatDate(employee.ngay_cap_cccd) : BLANK,
    noi_cap_cccd: dash(employee?.noi_cap_cccd),
    dia_chi_thuong_tru: dash(employee?.dia_chi_thuong_tru),
    dia_chi_hien_tai: dash(employee?.dia_chi_hien_tai),
    so_dien_thoai_nhan_vien: dash(employee?.so_dien_thoai),
    so_so_bhxh: dash(employee?.so_so_bhxh),
    ngay_hieu_luc: contract.ngay_hieu_luc ? formatDate(contract.ngay_hieu_luc) : BLANK,
    ngay_ket_thuc_hoac_khong_xac_dinh: contract.ngay_ket_thuc
      ? formatDate(contract.ngay_ket_thuc)
      : 'Không xác định thời hạn',
    ten_chuc_vu: dash(contract.ten_chuc_vu),
    ten_phong_ban: dash(contract.ten_phong_ban),
    noi_lam_viec: dash(contract.noi_lam_viec),
    thoi_gian_lam_viec: dash(contract.thoi_gian_lam_viec),
    muc_luong: dash(contract.muc_luong),
    hinh_thuc_tra_luong_ten: salaryMode,
    che_do_khac: dash(contract.che_do_khac),
    luu_y_khac: dash(contract.luu_y_khac),
    trang_thai_ten: statusLabel,
    tg_tao: contract.tg_tao ? formatDate(contract.tg_tao) : BLANK,
  };
}
