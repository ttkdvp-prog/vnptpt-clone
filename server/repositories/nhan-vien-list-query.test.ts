import { describe, expect, it } from 'vitest';
import { buildEmployeeWhere } from './nhan-vien-list-query';

describe('buildEmployeeWhere', () => {
  it('returns empty where when no filters', () => {
    expect(buildEmployeeWhere({})).toEqual({});
  });

  it('maps app status labels to DB tokens', () => {
    const where = buildEmployeeWhere({ trang_thai: ['Đang làm việc', 'Thử việc'] });
    expect(where).toEqual({ trang_thai: { in: ['ACTIVE', 'PROBATION'] } });
  });

  it('builds search OR with relations', () => {
    const where = buildEmployeeWhere({ search: 'an' });
    expect(where).toHaveProperty('OR');
    const or = (where as { OR: unknown[] }).OR;
    expect(or.length).toBeGreaterThan(4);
  });

  it('omits one dimension for exclude-self counts', () => {
    const where = buildEmployeeWhere(
      {
        trang_thai: ['Nghỉ việc'],
        phong_ban_id: ['1'],
      },
      'phong_ban_id',
    );
    expect(where).toEqual({ trang_thai: { in: ['INACTIVE'] } });
  });

  it('ANDs multiple filters', () => {
    const where = buildEmployeeWhere({
      gioi_tinh: ['Nam'],
      phong_ban_id: ['2'],
    });
    expect(where).toHaveProperty('AND');
  });
});
