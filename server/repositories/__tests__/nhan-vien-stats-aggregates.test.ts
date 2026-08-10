// @vitest-environment node
/**
 * getEmployeeStatsAggregates đọc toàn bộ sheet `var_nhan_vien` (TTL-cached qua
 * readTable) rồi group/đếm ở JS — Sheets không có groupBy ở tầng lưu trữ như
 * Postgres. Sheet nhân viên chỉ còn id/ho_va_ten/hinh_anh/trang_thai/mat_khau/
 * must_change_password (không còn phòng ban/chức vụ), nên aggregates giờ chỉ
 * còn nhóm theo trạng thái.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/sheets/generic-repository', () => ({
  readTable: vi.fn(),
}));

import { readTable } from '@/lib/sheets/generic-repository';
import { getEmployeeStatsAggregates } from '../nhan-vien';

function nvRow(id: number, trangThai: string): Record<string, string> {
  return {
    id: String(id),
    ho_va_ten: `NV ${id}`,
    hinh_anh: '',
    mat_khau: 'hash',
    trang_thai: trangThai,
    must_change_password: 'false',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getEmployeeStatsAggregates — nhóm theo trạng thái từ sheet var_nhan_vien', () => {
  it('cộng dồn đúng active/probation/inactive', async () => {
    vi.mocked(readTable).mockImplementation(async (tab: string) => {
      if (tab === 'var_nhan_vien') {
        return {
          headers: [],
          rows: [
            nvRow(1, 'ACTIVE'),
            nvRow(2, 'ACTIVE'),
            nvRow(3, 'ACTIVE'),
            nvRow(4, 'PROBATION'),
            nvRow(5, 'PROBATION'),
            nvRow(6, 'INACTIVE'),
          ],
        };
      }
      return { headers: [], rows: [] };
    });

    const result = await getEmployeeStatsAggregates({});

    expect(result.kpis).toMatchObject({ total: 6, active: 3, probation: 2, inactive: 1 });
  });

  it('sheet nhân viên rỗng ⇒ không lỗi', async () => {
    vi.mocked(readTable).mockImplementation(async (tab: string) => {
      if (tab === 'var_nhan_vien') return { headers: [], rows: [] };
      return { headers: [], rows: [] };
    });

    const result = await getEmployeeStatsAggregates({});
    expect(result.kpis.total).toBe(0);
    expect(result.byStatus).toEqual([]);
  });
});
