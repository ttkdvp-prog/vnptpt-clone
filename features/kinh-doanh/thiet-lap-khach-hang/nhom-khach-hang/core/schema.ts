import { z } from 'zod';
import { txt } from '@/lib/text';

export const nhomKhachHangSchema = z.object({
  ten_nhom: z
    .string()
    .trim()
    .min(2, txt('customerSettings.nhom.validation.nameMin'))
    .max(100, txt('customerSettings.nhom.validation.nameMax')),
  mo_ta: z
    .string()
    .max(500, txt('customerSettings.nhom.validation.descMax'))
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
});

export type NhomKhachHangFormValues = z.infer<typeof nhomKhachHangSchema>;
