import { z } from 'zod';
import { txt } from '@/lib/text';
import { DOCUMENT_STATUS } from './types';

const optionalTrimmed = (max: number, maxMsg: string) =>
  z
    .string()
    .max(max, maxMsg)
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()));

export const danhSachTaiLieuSchema = z.object({
  id_loai_tai_lieu: z.string().min(1, txt('document.validation.typeRequired')),
  ten_tai_lieu: z
    .string()
    .trim()
    .min(2, txt('document.validation.nameMin'))
    .max(200, txt('document.validation.nameMax')),
  mo_ta: optionalTrimmed(1000, txt('document.validation.descMax')),
  link_tai_lieu: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine(
      (v) =>
        v == null ||
        /^https?:\/\/.+/i.test(v) ||
        /^[a-z][a-z0-9+.-]*:\/\//i.test(v),
      { message: txt('document.validation.linkInvalid') },
    ),
  ghi_chu: optionalTrimmed(1000, txt('document.validation.noteMax')),
  trang_thai: z.enum([
    DOCUMENT_STATUS.DU_THAO,
    DOCUMENT_STATUS.HIEU_LUC,
    DOCUMENT_STATUS.LOI_THOI,
    DOCUMENT_STATUS.CHO_SUA,
  ]),
  id_chuc_vu: z.array(z.string()).default([]),
  id_nhan_vien: z.array(z.string()).default([]),
});

export type DanhSachTaiLieuFormValues = z.infer<typeof danhSachTaiLieuSchema>;
