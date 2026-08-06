import { z } from 'zod';
import { txt } from '@/lib/text';
import { maLoaiPhieuSchema } from './loai-phieu';
import { PHIEU_BUOI } from './types';

const buoiValues = [PHIEU_BUOI.SANG, PHIEU_BUOI.CHIEU, PHIEU_BUOI.DEM] as const;

const optionalTrimmed = (max: number, maxMsg: string) =>
  z
    .string()
    .max(max, maxMsg)
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()));

const optionalTime = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v == null || v.trim() === '' ? null : v.trim().slice(0, 5)))
  .refine((v) => v == null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), {
    message: txt('adminForm.validation.timeInvalid'),
  });

export const phieuHanhChinhSchema = z.object({
  ma_phieu: maLoaiPhieuSchema,
  id_nhan_vien: z.string().min(1, txt('adminForm.validation.employeeRequired')),
  tu_ngay: z
    .string()
    .min(1, txt('adminForm.validation.fromDateRequired'))
    .transform((v) => v.trim().slice(0, 10)),
  buoi_bat_dau: z.enum(buoiValues, {
    message: txt('adminForm.validation.shiftRequired'),
  }),
  den_ngay: z
    .string()
    .min(1, txt('adminForm.validation.toDateRequired'))
    .transform((v) => v.trim().slice(0, 10)),
  buoi_ket_thuc: z.enum(buoiValues, {
    message: txt('adminForm.validation.shiftRequired'),
  }),
  gio_bat_dau: optionalTime,
  gio_ket_thuc: optionalTime,
  ly_do: optionalTrimmed(2000, txt('adminForm.validation.reasonMax')),
  hinh_anh: z.array(z.string()).optional().default([]),
});

export type PhieuHanhChinhFormValues = z.infer<typeof phieuHanhChinhSchema>;
