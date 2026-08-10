import { z } from 'zod';
import { txt } from '@/lib/text';
import { TRANG_THAI_NHAN_VIEN } from './constants';

export const employeeSchema = z.object({
  ho_ten: z.string().min(2, { message: txt('employee.validation.nameMin') }),
  trang_thai: z.enum(TRANG_THAI_NHAN_VIEN),
  anh_dai_dien: z.string().optional().nullable(),
  ten_dang_nhap: z.string().optional().nullable(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export function createEmployeeSchema() {
  return employeeSchema;
}

export const employeeCreateAuthFieldsSchema = z.object({
  id: z.string().min(1, { message: txt('employee.validation.codeRequired') }),
  mat_khau_tam: z
    .string()
    .min(6, { message: txt('employee.validation.tempPasswordMin') }),
});

export function createEmployeeCreateSchema() {
  return employeeSchema.merge(employeeCreateAuthFieldsSchema);
}

export type EmployeeCreateFormValues = z.infer<typeof employeeCreateAuthFieldsSchema> &
  EmployeeFormValues;

export const employeeEditAuthFieldsSchema = z.object({
  mat_khau_tam: z.string().optional(),
});

export type EmployeeEditFormValues = z.infer<typeof employeeEditAuthFieldsSchema> &
  EmployeeFormValues;

export function createEmployeeEditSchema() {
  return employeeSchema.merge(employeeEditAuthFieldsSchema);
}
