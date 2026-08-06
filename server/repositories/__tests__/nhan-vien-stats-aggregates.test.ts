// @vitest-environment node
/**
 * getEmployeeStatsAggregates đọc toàn bộ sheet `var_nhan_vien` (TTL-cached qua
 * readTable) rồi group/đếm ở JS — Sheets không có groupBy ở tầng lưu trữ như
 * Postgres. Test này chứng minh deptSummary tính đúng active/probation/inactive
 * theo từng phòng ban từ dữ liệu sheet thô.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/sheets/generic-repository', () => ({
  readTable: vi.fn(),
}));

import { readTable } from '@/lib/sheets/generic-repository';
import { getEmployeeStatsAggregates } from '../nhan-vien';

function nvRow(id: number, idPhongBan: string | null, trangThai: string): Record<string, string> {
  return {
    id: String(id),
    ho_va_ten: `NV ${id}`,
    tai_khoan: `nv${id}`,
    mat_khau: 'hash',
    trang_thai: trangThai,
    id_phong_ban: idPhongBan ?? '',
    id_chuc_vu: '',
    gioi_tinh: 'Nam',
    tg_tao: '2026-01-01T00:00:00.000Z',
    must_change_password: 'false',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readTable).mockImplementation(async (tab: string) => {
    if (tab === 'var_phong_ban') {
      return {
        headers: ['id', 'ten_phong_ban'],
        rows: [
          { id: '1', ten_phong_ban: 'Kỹ thuật' },
          { id: '2', ten_phong_ban: 'Kinh doanh' },
        ],
      };
    }
    if (tab === 'var_chuc_vu') return { headers: [], rows: [] };
    return { headers: [], rows: [] };
  });
});

describe('getEmployeeStatsAggregates — deptSummary từ toàn bộ sheet var_nhan_vien', () => {
  it('cộng dồn đúng active/probation/inactive theo từng phòng ban', async () => {
    vi.mocked(readTable).mockImplementation(async (tab: string) => {
      if (tab === 'var_nhan_vien') {
        return {
          headers: [],
          rows: [
            nvRow(1, '1', 'ACTIVE'),
            nvRow(2, '1', 'ACTIVE'),
            nvRow(3, '1', 'ACTIVE'),
            nvRow(4, '1', 'PROBATION'),
            nvRow(5, '1', 'PROBATION'),
            nvRow(6, '2', 'ACTIVE'),
            nvRow(7, '2', 'ACTIVE'),
            nvRow(8, '2', 'INACTIVE'),
            nvRow(9, null, 'ACTIVE'),
          ],
        };
      }
      if (tab === 'var_phong_ban') {
        return {
          headers: [],
          rows: [
            { id: '1', ten_phong_ban: 'Kỹ thuật' },
            { id: '2', ten_phong_ban: 'Kinh doanh' },
          ],
        };
      }
      return { headers: [], rows: [] };
    });

    const result = await getEmployeeStatsAggregates({});

    const dept1 = result.deptSummary.find((d) => d.id === '1');
    const dept2 = result.deptSummary.find((d) => d.id === '2');
    const deptNone = result.deptSummary.find((d) => d.id === null);

    expect(dept1).toMatchObject({ name: 'Kỹ thuật', total: 5, active: 3, probation: 2, inactive: 0 });
    expect(dept2).toMatchObject({ name: 'Kinh doanh', total: 3, active: 2, probation: 0, inactive: 1 });
    expect(deptNone).toMatchObject({ name: 'Chưa phân bổ', total: 1, active: 1 });
  });

  it('sheet nhân viên rỗng ⇒ deptSummary rỗng, không lỗi', async () => {
    vi.mocked(readTable).mockImplementation(async (tab: string) => {
      if (tab === 'var_nhan_vien') return { headers: [], rows: [] };
      return { headers: [], rows: [] };
    });

    const result = await getEmployeeStatsAggregates({});
    expect(result.deptSummary).toEqual([]);
  });
});
