import { z } from 'zod';
import { txt } from '@/lib/text';

const optionalTrimmed = (max: number, maxMsg: string) =>
  z
    .string()
    .max(max, maxMsg)
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()));

export const marketInSchema = z.object({
  thu_tu: z.coerce
    .number()
    .int()
    .min(0, txt('printMarket.validation.orderMin')),
  id_khach_hang: z.string().min(1, txt('printMarket.validation.customerRequired')),
  ma_san_pham: z
    .string()
    .trim()
    .min(1, txt('printMarket.validation.productCodeRequired'))
    .max(100, txt('printMarket.validation.productCodeMax')),
  ma_market: z
    .string()
    .trim()
    .min(1, txt('printMarket.validation.marketCodeRequired'))
    .max(50, txt('printMarket.validation.marketCodeMax')),
  mo_ta: optionalTrimmed(1000, txt('printMarket.validation.descMax')),
  link_file: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
    .refine(
      (v) =>
        v == null ||
        /^https?:\/\/.+/i.test(v) ||
        /^[a-z][a-z0-9+.-]*:\/\//i.test(v),
      { message: txt('printMarket.validation.linkInvalid') },
    ),
  id_nguoi_ve: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim())),
  ngay_hieu_luc: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v == null || v.trim() === '' ? null : v.trim().slice(0, 10))),
});

export type MarketInFormValues = z.infer<typeof marketInSchema>;
