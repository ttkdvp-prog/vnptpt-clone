import { describe, expect, it } from 'vitest';
import type { Department } from '@/features/he-thong/phong-ban/core/types';
import {
  buildDeptAccessGroups,
  DEPT_ACCESS_UNASSIGNED_KEY,
  getSubtreeItemIds,
  type DeptAccessItem,
} from '../build-dept-access-groups';

function dept(
  partial: Pick<Department, 'id' | 'ten_phong_ban' | 'cha_id' | 'cap_do' | 'thu_tu'>,
): Department {
  return {
    ma_phong_ban: partial.id,
    duong_dan: partial.cha_id ? `/${partial.cha_id}/${partial.id}` : `/${partial.id}`,
    trang_thai: 'Đang hoạt động',
    tg_tao: '',
    tg_cap_nhat: '',
    ...partial,
  };
}

const departments: Department[] = [
  dept({ id: 'root', ten_phong_ban: 'HCNS', cha_id: null, cap_do: 1, thu_tu: 1 }),
  dept({ id: 'child', ten_phong_ban: 'Nhân sự', cha_id: 'root', cap_do: 2, thu_tu: 1 }),
  dept({ id: 'other', ten_phong_ban: 'Kế toán', cha_id: null, cap_do: 1, thu_tu: 2 }),
];

const items: DeptAccessItem[] = [
  { id: 'p1', label: 'Trưởng phòng', phong_ban_id: 'root' },
  { id: 'p2', label: 'Chuyên viên', phong_ban_id: 'child' },
  { id: 'p3', label: 'Kế toán viên', phong_ban_id: 'other' },
  { id: 'p4', label: 'Chưa gán', phong_ban_id: null },
];

describe('buildDeptAccessGroups', () => {
  it('orders by department DFS and keeps direct items only', () => {
    const groups = buildDeptAccessGroups(departments, items, 'Chưa gán phòng ban');
    expect(groups.map((g) => g.deptId)).toEqual([
      'root',
      'child',
      'other',
      DEPT_ACCESS_UNASSIGNED_KEY,
    ]);
    expect(groups[0].items.map((i) => i.id)).toEqual(['p1']);
    expect(groups[1].items.map((i) => i.id)).toEqual(['p2']);
    expect(groups[1].level).toBe(2);
    expect(groups[3].label).toBe('Chưa gán phòng ban');
  });

  it('hides departments with no direct items', () => {
    const sparse = items.filter((i) => i.phong_ban_id !== 'other');
    const groups = buildDeptAccessGroups(departments, sparse, 'Chưa gán');
    expect(groups.map((g) => g.deptId)).not.toContain('other');
  });
});

describe('getSubtreeItemIds', () => {
  it('includes items in department and children', () => {
    const ids = getSubtreeItemIds(departments, items, 'root');
    expect(ids.sort()).toEqual(['p1', 'p2'].sort());
  });

  it('child dept only returns its own items', () => {
    expect(getSubtreeItemIds(departments, items, 'child')).toEqual(['p2']);
  });

  it('unassigned bucket only', () => {
    expect(getSubtreeItemIds(departments, items, DEPT_ACCESS_UNASSIGNED_KEY)).toEqual([
      'p4',
    ]);
  });
});
