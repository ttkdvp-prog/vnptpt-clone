import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployeesPage } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';

const EMPLOYEES_PAGE_SIZE = 100;

/**
 * Danh sách TOÀN BỘ nhân viên (kèm `to_phong`/`chuc_danh`) — tái dùng service list nhân viên
 * hiện có, gộp nhiều trang vì server giới hạn tối đa 100 bản ghi/trang.
 */
export function useEmployees(): Employee[] {
  const { data } = useQuery({
    queryKey: ['cong-viec', 'all-employees'],
    queryFn: async () => {
      const first = await getEmployeesPage({ limit: EMPLOYEES_PAGE_SIZE, offset: 0, orderBy: 'ho_ten', ascending: true });
      const pages = [first.items];
      for (let offset = EMPLOYEES_PAGE_SIZE; offset < first.total; offset += EMPLOYEES_PAGE_SIZE) {
        const page = await getEmployeesPage({ limit: EMPLOYEES_PAGE_SIZE, offset, orderBy: 'ho_ten', ascending: true });
        pages.push(page.items);
      }
      return pages.flat();
    },
    staleTime: 5 * 60 * 1000,
  });
  return data ?? [];
}

/** Danh sách nhân viên cho dropdown mnv_a/mnv_r/mnv_c — tái dùng API list nhân viên hiện có, không tạo endpoint riêng. */
export function useEmployeeOptions() {
  const items = useEmployees();
  return useMemo(() => items.map((e) => ({ label: e.ho_ten, value: e.id })), [items]);
}

/** Tổ trưởng của `to_phong` — nhận diện qua `chuc_danh` chứa "tổ trưởng" (không phân biệt hoa/thường). */
export function findToTruong(employees: Employee[], to_phong: string): Employee | undefined {
  return employees.find(
    (e) => e.to_phong === to_phong && e.chuc_danh?.toLowerCase().includes('tổ trưởng'),
  );
}
