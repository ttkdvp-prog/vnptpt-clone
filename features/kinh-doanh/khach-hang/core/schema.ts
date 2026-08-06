import { z } from 'zod';
import { txt } from '@/lib/text';
import { PHONE_VN_REGEX } from '@/lib/validation/phone-vn';

export const khachHangSchema = z.object({
  ma_khach_hang: z
    .string()
    .trim()
    .min(1, txt('customer.validation.codeRequired'))
    .max(50, txt('customer.validation.codeMax')),
  ten_khach_hang: z
    .string()
    .trim()
    .min(2, txt('customer.validation.nameMin'))
    .max(200, txt('customer.validation.nameMax')),
  so_dien_thoai: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine((v) => v == null || PHONE_VN_REGEX.test(v), {
      message: txt('customer.validation.phoneInvalid'),
    }),
  dia_chi: z
    .string()
    .max(500, txt('customer.validation.addressMax'))
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
  ghi_chu: z
    .string()
    .max(1000, txt('customer.validation.noteMax'))
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
  id_nhom: z.string().min(1, txt('customer.validation.groupRequired')),
  id_trang_thai: z.string().min(1, txt('customer.validation.statusRequired')),
});

export type KhachHangFormValues = z.infer<typeof khachHangSchema>;
