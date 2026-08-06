import { z } from 'zod';
import { txt } from '@/lib/text';
import { CONTRACT_STATUS, CONTRACT_TYPE, SALARY_MODE } from './types';

const optionalTrimmed = (max: number, maxMsg: string) =>
  z
    .string()
    .max(max, maxMsg)
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()));

export const hopDongSchema = z
  .object({
    loai_hop_dong: z.enum([CONTRACT_TYPE.THU_VIEC, CONTRACT_TYPE.CHINH_THUC]),
    ma_hop_dong: z
      .string()
      .trim()
      .min(2, txt('contract.validation.codeMin'))
      .max(50, txt('contract.validation.codeMax')),
    ngay_ky: z.string().min(1, txt('contract.validation.signDateRequired')),
    ngay_hieu_luc: z.string().min(1, txt('contract.validation.effectiveDateRequired')),
    ngay_ket_thuc: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
    id_nhan_vien: z.string().min(1, txt('contract.validation.employeeRequired')),
    id_chuc_vu: z.string().min(1, txt('contract.validation.positionRequired')),
    id_phong_ban: z.string().min(1, txt('contract.validation.departmentRequired')),
    muc_luong: z
      .string()
      .trim()
      .min(1, txt('contract.validation.salaryRequired'))
      .max(200, txt('contract.validation.salaryMax')),
    hinh_thuc_tra_luong: z.enum([
      SALARY_MODE.THEO_THANG,
      SALARY_MODE.THEO_NGAY,
      SALARY_MODE.THEO_GIO,
    ]),
    che_do_khac: optionalTrimmed(1000, txt('contract.validation.textMax')),
    noi_lam_viec: optionalTrimmed(200, txt('contract.validation.textMax')),
    thoi_gian_lam_viec: optionalTrimmed(200, txt('contract.validation.textMax')),
    luu_y_khac: optionalTrimmed(1000, txt('contract.validation.textMax')),
    ghi_chu: optionalTrimmed(1000, txt('contract.validation.textMax')),
    trang_thai: z.enum([CONTRACT_STATUS.CHUA_XONG, CONTRACT_STATUS.DA_XONG]),
  })
  .refine(
    (data) =>
      !data.ngay_ket_thuc ||
      data.ngay_ket_thuc >= data.ngay_hieu_luc,
    {
      message: txt('contract.validation.endDateAfterEffective'),
      path: ['ngay_ket_thuc'],
    },
  );

export type HopDongFormValues = z.infer<typeof hopDongSchema>;
