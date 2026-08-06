import { z } from 'zod';
import { txt } from '@/lib/text';
import type { Position } from '@/features/he-thong/chuc-vu/core/types';
import {
  findPositionById,
  getPositionDepartmentId,
} from '../utils/build-employee-position-options';
import { TRANG_THAI_NHAN_VIEN } from './constants';
import { emailSchema } from '@/lib/validation/email';
import { PHONE_VN_REGEX, phoneVnSchema } from '@/lib/validation/phone-vn';
import { loginNameSchema, normalizeLoginName } from '@/lib/validation/login-name';
import { isApi } from '@/lib/data/config';

const optionalNullableText = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v == null || v.trim() === '' ? null : v.trim()));

const optionalNullableEmail = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
  .refine((v) => v == null || z.string().email().safeParse(v).success, {
    message: txt('employee.validation.personalEmailInvalid'),
  });

const optionalNullablePhone = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v == null || v.trim() === '' ? null : v.trim()))
  .refine((v) => v == null || PHONE_VN_REGEX.test(v), {
    message: txt('employee.validation.emergencyPhoneInvalid'),
  });

/** Identity + HR profile fields shared by mock & api schemas */
const hrProfileFields = {
  ngay_sinh: optionalNullableText,
  so_cccd: optionalNullableText,
  ngay_cap_cccd: optionalNullableText,
  noi_cap_cccd: optionalNullableText,
  dia_chi_thuong_tru: optionalNullableText,
  dia_chi_hien_tai: optionalNullableText,
  que_quan: optionalNullableText,
  dan_toc: optionalNullableText,
  ton_giao: optionalNullableText,
  tinh_trang_hon_nhan: optionalNullableText,
  quoc_tich: optionalNullableText,
  email_ca_nhan: optionalNullableEmail,
  ngay_vao_lam: optionalNullableText,
  ngay_chinh_thuc: optionalNullableText,
  ngay_nghi_viec: optionalNullableText,
  ly_do_nghi: optionalNullableText,
  so_tai_khoan: optionalNullableText,
  ten_chu_tai_khoan: optionalNullableText,
  ngan_hang: optionalNullableText,
  chi_nhanh: optionalNullableText,
  nguoi_lien_he_khan: optionalNullableText,
  sdt_khan: optionalNullablePhone,
  moi_quan_he: optionalNullableText,
  so_so_bhxh: optionalNullableText,
  so_bhyt: optionalNullableText,
  ma_so_thue_ca_nhan: optionalNullableText,
  trinh_do: optionalNullableText,
  chuyen_nganh: optionalNullableText,
  truong: optionalNullableText,
};

const employeeSchemaApi = z.object({
  ho_ten: z.string().min(2, { message: txt('employee.validation.nameMin') }),
  email: z.string().optional().default(''),
  so_dien_thoai: z.string().optional().default(''),
  chuc_vu_id: z.string().min(1, { message: txt('employee.validation.positionRequired') }),
  phong_ban_id: z.string().min(1, { message: txt('employee.validation.departmentRequired') }),
  gioi_tinh: z.enum(['Nam', 'Nữ', 'Khác']).default('Nam'),
  ...hrProfileFields,
  trang_thai: z.enum(TRANG_THAI_NHAN_VIEN),
  anh_dai_dien: z.string().optional().nullable(),
});

const employeeSchemaMock = z.object({
  ho_ten: z.string().min(2, { message: txt('employee.validation.nameMin') }),
  email: emailSchema(),
  so_dien_thoai: phoneVnSchema(),
  chuc_vu_id: z.string().min(1, { message: txt('employee.validation.positionRequired') }),
  phong_ban_id: z.string().min(1, { message: txt('employee.validation.departmentRequired') }),
  gioi_tinh: z.enum(['Nam', 'Nữ', 'Khác']),
  ...hrProfileFields,
  trang_thai: z.enum(TRANG_THAI_NHAN_VIEN),
  anh_dai_dien: z.string().optional().nullable(),
});

function refineResignationFields(
  data: { trang_thai: string; ngay_nghi_viec?: string | null },
  ctx: z.RefinementCtx,
): void {
  if (data.trang_thai !== 'Nghỉ việc') return;
  if (!data.ngay_nghi_viec || String(data.ngay_nghi_viec).trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ngay_nghi_viec'],
      message: txt('employee.validation.resignationDateRequired'),
    });
  }
}

export const employeeSchema = (isApi() ? employeeSchemaApi : employeeSchemaMock).superRefine(
  refineResignationFields,
);

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

type PositionsSource = Position[] | (() => Position[]);

function resolvePositions(source: PositionsSource): Position[] {
  return typeof source === 'function' ? source() : source;
}

export function createEmployeeSchema(positions: PositionsSource = []) {
  return employeeSchema.superRefine((data, ctx) => {
    refineEmployeePositionFields(resolvePositions(positions), data, ctx);
  });
}

export const employeeCreateAuthFieldsSchema = z.object({
  ten_dang_nhap: loginNameSchema(),
  mat_khau_tam: z
    .string()
    .min(6, { message: txt('employee.validation.tempPasswordMin') }),
});

export function createEmployeeCreateSchema(positions: PositionsSource = []) {
  return employeeSchema
    .merge(employeeCreateAuthFieldsSchema)
    .superRefine((data, ctx) => {
      refineResignationFields(data, ctx);
      refineEmployeePositionFields(resolvePositions(positions), data, ctx);
    });
}

export type EmployeeCreateFormValues = z.infer<typeof employeeCreateAuthFieldsSchema> &
  EmployeeFormValues;

export const employeeEditAuthFieldsSchema = z.object({
  ten_dang_nhap: z.union([z.literal(''), loginNameSchema()]).optional(),
  mat_khau_tam: z.string().optional(),
});

export type EmployeeEditFormValues = z.infer<typeof employeeEditAuthFieldsSchema> &
  EmployeeFormValues;

function refineEmployeePositionFields(
  positions: Position[],
  data: EmployeeFormValues,
  ctx: z.RefinementCtx,
): void {
  if (!data.chuc_vu_id) return;
  const position = findPositionById(positions, data.chuc_vu_id);
  if (!position) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['chuc_vu_id'],
      message: txt('employee.validation.positionRequired'),
    });
    return;
  }
  const positionDeptId = getPositionDepartmentId(position);
  if (!positionDeptId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['chuc_vu_id'],
      message: txt('employee.validation.positionNoDepartment'),
    });
    return;
  }
  if (data.phong_ban_id && String(data.phong_ban_id) !== positionDeptId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phong_ban_id'],
      message: txt('employee.validation.departmentMismatch'),
    });
  }
}

function refineEmployeeEditAuthFields(
  initialLogin: string | null | undefined,
  data: EmployeeEditFormValues,
  ctx: z.RefinementCtx,
): void {
  const normalizedInitial = initialLogin?.trim()
    ? normalizeLoginName(initialLogin)
    : '';
  const newLogin = data.ten_dang_nhap?.trim()
    ? normalizeLoginName(data.ten_dang_nhap)
    : '';
  const loginChanged = normalizedInitial
    ? newLogin !== normalizedInitial
    : Boolean(newLogin);
  const needsPassword = loginChanged || (!normalizedInitial && Boolean(newLogin));

  if (needsPassword && (!data.mat_khau_tam || data.mat_khau_tam.length < 6)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['mat_khau_tam'],
      message: txt('employee.validation.tempPasswordMin'),
    });
  }
}

export function createEmployeeEditSchema(
  positions: PositionsSource = [],
  initialLogin?: string | null,
) {
  return employeeSchema
    .merge(employeeEditAuthFieldsSchema)
    .superRefine((data, ctx) => {
      refineResignationFields(data, ctx);
      refineEmployeePositionFields(resolvePositions(positions), data, ctx);
      refineEmployeeEditAuthFields(initialLogin, data, ctx);
    });
}
