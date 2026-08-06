import { z } from 'zod';
import { txt } from '@/lib/text';

export const trangThaiKhachHangSchema = z.object({
  ten_trang_thai: z
    .string()
    .trim()
    .min(2, txt('customerSettings.trangThai.validation.nameMin'))
    .max(100, txt('customerSettings.trangThai.validation.nameMax')),
  mo_ta: z
    .string()
    .max(500, txt('customerSettings.trangThai.validation.descMax'))
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
});

export type TrangThaiKhachHangFormValues = z.infer<typeof trangThaiKhachHangSchema>;
