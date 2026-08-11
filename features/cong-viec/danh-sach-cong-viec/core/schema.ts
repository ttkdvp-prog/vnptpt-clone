import { z } from 'zod';
import { txt } from '@/lib/text';
import { CAP_CONG_VIEC, UU_TIEN_CONG_VIEC } from './constants';

export const congViecSchema = z
  .object({
    cap: z.enum(CAP_CONG_VIEC, { message: txt('congViec.validation.capInvalid') }),
    tieu_de: z.string().min(1, { message: txt('congViec.validation.tieuDeRequired') }),
    mo_ta: z.string().optional().nullable(),
    to_ar: z.string().min(1, { message: txt('congViec.validation.toArRequired') }),
    to_r: z.string().optional().nullable(),
    mnv_a: z.string().min(1, { message: txt('congViec.validation.mnvARequired') }),
    mnv_r: z.string().optional().nullable(),
    mnv_c: z.string().optional().nullable(),
    mnv_bgd: z.string().optional().nullable(),
    uu_tien: z.enum(UU_TIEN_CONG_VIEC, { message: txt('congViec.validation.uuTienInvalid') }),
    ngay_bd: z.string().min(1, { message: txt('congViec.validation.ngayBdRequired') }),
    ngay_kt: z.string().min(1, { message: txt('congViec.validation.ngayKtRequired') }),
    ghi_chu: z.string().optional().nullable(),
    ngay_ht: z.string().optional().nullable(),
    tep_dinh_kem: z.string().optional().nullable(),
    ke_hoach: z.coerce.number().int().nonnegative().optional().nullable(),
    thuc_hien: z.coerce.number().int().nonnegative().optional().nullable(),
  })
  .refine((data) => data.ngay_kt >= data.ngay_bd, {
    message: txt('congViec.validation.ngayKtBeforeBd'),
    path: ['ngay_kt'],
  });

export type CongViecFormValues = z.infer<typeof congViecSchema>;

export function createCongViecSchema() {
  return congViecSchema;
}
