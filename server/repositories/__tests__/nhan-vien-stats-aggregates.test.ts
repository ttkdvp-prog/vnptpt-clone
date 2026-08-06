// @vitest-environment node
/**
 * getEmployeeStatsAggregates trước đây fetch TOÀN BẢNG nhân viên (findMany
 * không `take`, chỉ select trang_thai/id_phong_ban/tên phòng ban) chỉ để đếm
 * active/probation/inactive theo phòng ban ở JS. Test này chứng minh
 * deptSummary tính đúng khi thay bằng groupBy(['id_phong_ban','trang_thai'])
 * ở DB — kết quả phải tương đương, chỉ khác đường lấy dữ liệu.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  var_nhan_vien: {
    count: vi.fn(),
    groupBy: vi.fn(),
    // Chỉ còn dùng cho fetch 12 tháng gần nhất (bounded theo ngày, không phải
    // toàn bảng) — trả rỗng ở đây vì test này không kiểm phần hiresByMonth.
    findMany: vi.fn(() => Promise.resolve([])),
  },
  var_phong_ban: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/server/db', () => ({ prisma: prismaMock }));

import { getEmployeeStatsAggregates } from '../nhan-vien';

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.var_nhan_vien.count.mockResolvedValue(0);
});

describe('getEmployeeStatsAggregates — deptSummary từ groupBy(id_phong_ban, trang_thai)', () => {
  it('cộng dồn đúng active/probation/inactive theo từng phòng ban, không fetch toàn bảng', async () => {
    prismaMock.var_nhan_vien.groupBy.mockImplementation(({ by }: { by: string[] }) => {
      if (by.length === 1 && by[0] === 'id_phong_ban') {
        return Promise.resolve([
          { id_phong_ban: 1, _count: { _all: 5 } },
          { id_phong_ban: 2, _count: { _all: 3 } },
        ]);
      }
      if (by.length === 1 && by[0] === 'trang_thai') {
        return Promise.resolve([{ trang_thai: 'ACTIVE', _count: { _all: 8 } }]);
      }
      if (by.length === 1 && by[0] === 'gioi_tinh') {
        return Promise.resolve([{ gioi_tinh: 'Nam', _count: { _all: 8 } }]);
      }
      // by ['id_phong_ban', 'trang_thai'] — dữ liệu tổng hợp thay cho findMany toàn bảng.
      return Promise.resolve([
        { id_phong_ban: 1, trang_thai: 'ACTIVE', _count: { _all: 3 } },
        { id_phong_ban: 1, trang_thai: 'PROBATION', _count: { _all: 2 } },
        { id_phong_ban: 2, trang_thai: 'ACTIVE', _count: { _all: 2 } },
        { id_phong_ban: 2, trang_thai: 'INACTIVE', _count: { _all: 1 } },
        { id_phong_ban: null, trang_thai: 'ACTIVE', _count: { _all: 1 } },
      ]);
    });
    prismaMock.var_phong_ban.findMany.mockResolvedValue([
      { id: 1, ten_phong_ban: 'Kỹ thuật' },
      { id: 2, ten_phong_ban: 'Kinh doanh' },
    ]);

    const result = await getEmployeeStatsAggregates({});

    // Trọng tâm của bản sửa: không còn findMany toàn bảng nhân viên chỉ để
    // đếm theo phòng ban — mọi lệnh var_nhan_vien.findMany (nếu có) giờ chỉ
    // phục vụ hiresByMonth, đã bounded theo 12 tháng, không theo headcount.
    const findManyCalls = prismaMock.var_nhan_vien.findMany.mock.calls as unknown as Array<
      [{ select?: Record<string, unknown> }]
    >;
    for (const [args] of findManyCalls) {
      expect(args?.select).toEqual({ tg_tao: true });
    }

    const dept1 = result.deptSummary.find((d) => d.id === '1');
    const dept2 = result.deptSummary.find((d) => d.id === '2');
    const deptNone = result.deptSummary.find((d) => d.id === null);

    expect(dept1).toMatchObject({
      name: 'Kỹ thuật',
      total: 5,
      active: 3,
      probation: 2,
      inactive: 0,
    });
    expect(dept2).toMatchObject({
      name: 'Kinh doanh',
      total: 3,
      active: 2,
      probation: 0,
      inactive: 1,
    });
    expect(deptNone).toMatchObject({ name: 'Chưa phân bổ', total: 1, active: 1 });
  });

  it('phòng ban trống (không có dòng groupBy nào) ⇒ deptSummary rỗng, không lỗi', async () => {
    prismaMock.var_nhan_vien.groupBy.mockResolvedValue([]);
    prismaMock.var_phong_ban.findMany.mockResolvedValue([]);

    const result = await getEmployeeStatsAggregates({});
    expect(result.deptSummary).toEqual([]);
  });
});
