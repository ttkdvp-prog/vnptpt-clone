import { z } from 'zod';
import { txt } from '@/lib/text';

export const loaiTaiLieuSchema = z.object({
  thu_tu: z.coerce.number().int().min(0, txt('documentSettings.loai.validation.orderMin')),
  ten_loai_tai_lieu: z
    .string()
    .trim()
    .min(2, txt('documentSettings.loai.validation.nameMin'))
    .max(100, txt('documentSettings.loai.validation.nameMax')),
  mo_ta: z
    .string()
    .max(500, txt('documentSettings.loai.validation.descMax'))
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
});

export type LoaiTaiLieuFormValues = z.infer<typeof loaiTaiLieuSchema>;
