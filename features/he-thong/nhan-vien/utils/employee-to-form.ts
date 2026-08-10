import type { Employee } from '../core/types';
import type { EmployeeCreateFormValues, EmployeeEditFormValues, EmployeeFormValues } from '../core/schema';

export function getDefaultEmployeeFormValues(): EmployeeFormValues {
  return {
    ho_ten: '',
    trang_thai: 'Đang làm việc',
    anh_dai_dien: '',
    ten_dang_nhap: '',
  };
}

export function getDefaultEmployeeCreateFormValues(): EmployeeCreateFormValues {
  return {
    ...getDefaultEmployeeFormValues(),
    id: '',
    mat_khau_tam: '',
  };
}

export function employeeToFormValues(emp: Employee): EmployeeFormValues {
  return {
    ho_ten: emp.ho_ten,
    trang_thai: emp.trang_thai,
    anh_dai_dien: emp.anh_dai_dien ?? undefined,
    ten_dang_nhap: emp.ten_dang_nhap ?? '',
  };
}

export function employeeToEditFormValues(emp: Employee): EmployeeEditFormValues {
  return {
    ...employeeToFormValues(emp),
    mat_khau_tam: '',
  };
}
