import { z } from 'zod';
import { txt } from '@/lib/text';
import { TINH_TRANG_TAI_LIEU } from './constants';

export const taiLieuSchema = z
  .object({
    ten_ho_so: z.string().min(1, { message: txt('congViecTaiLieu.validation.nameRequired') }),
    danh_muc: z.string().min(1, { message: txt('congViecTaiLieu.validation.categoryRequired') }),
    to: z.string().min(1, { message: txt('congViecTaiLieu.validation.toRequired') }),
    ngay_ban_hanh: z.string().min(1, { message: txt('congViecTaiLieu.validation.issueDateRequired') }),
    ngay_ket_thuc: z.string().optional().nullable(),
    tinh_trang: z.enum(TINH_TRANG_TAI_LIEU, {
      message: txt('congViecTaiLieu.validation.statusInvalid'),
    }),
    url: z.string().optional().nullable(),
    mo_ta: z.string().optional().nullable(),
  })
  .refine(
    (data) => !data.ngay_ket_thuc || data.ngay_ket_thuc >= data.ngay_ban_hanh,
    {
      message: txt('congViecTaiLieu.validation.endDateBeforeStart'),
      path: ['ngay_ket_thuc'],
    },
  );

export type TaiLieuFormValues = z.infer<typeof taiLieuSchema>;

export function createTaiLieuSchema() {
  return taiLieuSchema;
}
