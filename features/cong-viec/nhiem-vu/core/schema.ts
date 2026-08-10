import { z } from 'zod';
import { txt } from '@/lib/text';
import { TRANG_THAI_NHIEM_VU, UU_TIEN_NHIEM_VU } from './constants';

export const nhiemVuSchema = z.object({
  tieu_de: z.string().min(1, { message: txt('nhiemVu.validation.tieuDeRequired') }),
  mo_ta: z.string().optional().nullable(),
  nguoi_phu_trach: z.string().min(1, { message: txt('nhiemVu.validation.nguoiPhuTrachRequired') }),
  han_chot: z.string().min(1, { message: txt('nhiemVu.validation.hanChotRequired') }),
  trang_thai: z.enum(TRANG_THAI_NHIEM_VU, { message: txt('nhiemVu.validation.trangThaiInvalid') }),
  uu_tien: z.enum(UU_TIEN_NHIEM_VU, { message: txt('nhiemVu.validation.uuTienInvalid') }),
  ghi_chu: z.string().optional().nullable(),
});

export type NhiemVuFormValues = z.infer<typeof nhiemVuSchema>;

export function createNhiemVuSchema() {
  return nhiemVuSchema;
}
