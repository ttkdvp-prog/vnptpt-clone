import { z } from 'zod';
import { txt } from '@/lib/text';

export const thongBaoSchema = z.object({
  tg_dang: z.string().min(1, txt('announcement.validation.datetimeRequired')),
  tieu_de: z
    .string()
    .trim()
    .min(1, txt('announcement.validation.titleRequired'))
    .max(200, txt('announcement.validation.titleMax')),
  noi_dung: z
    .string()
    .trim()
    .min(1, txt('announcement.validation.contentRequired'))
    .max(10000, txt('announcement.validation.contentMax')),
  id_chuc_vu: z.array(z.string()).default([]),
});

export type ThongBaoFormValues = z.infer<typeof thongBaoSchema>;
