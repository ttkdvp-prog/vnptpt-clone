import { z } from 'zod';
import { txt } from '@/lib/text';
import { PHONE_VN_REGEX } from '@/lib/validation/phone-vn';

const NGAY_SINH_RE = /^(\d{4}|\d{4}-\d{2}-\d{2})$/;

export const nguoiLienHeSchema = z.object({
  id_khach_hang: z.string().min(1, txt('contact.validation.customerRequired')),
  ho_ten: z
    .string()
    .trim()
    .min(2, txt('contact.validation.nameMin'))
    .max(200, txt('contact.validation.nameMax')),
  ngay_sinh: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine((v) => v == null || NGAY_SINH_RE.test(v), {
      message: txt('contact.validation.birthInvalid'),
    }),
  chuc_vu: z
    .string()
    .max(100, txt('contact.validation.titleMax'))
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
  so_dien_thoai: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine((v) => v == null || PHONE_VN_REGEX.test(v), {
      message: txt('contact.validation.phoneInvalid'),
    }),
  email: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine((v) => v == null || z.string().email().safeParse(v).success, {
      message: txt('contact.validation.emailInvalid'),
    }),
  dia_chi: z
    .string()
    .max(500, txt('contact.validation.addressMax'))
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
  ghi_chu: z
    .string()
    .max(1000, txt('contact.validation.noteMax'))
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
});

export type NguoiLienHeFormValues = z.infer<typeof nguoiLienHeSchema>;
