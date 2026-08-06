import type { Department } from '@/features/he-thong/phong-ban/core/types';
import { getDepartmentSubtreeIds } from '@/features/he-thong/chuc-vu/utils/build-position-tree-rows';
import { flattenTreeToSortedList } from '@/lib/tree-utils';
import { getLanguage } from '@/lib/utils';

export const DEPT_ACCESS_UNASSIGNED_KEY = '__none__';

export interface DeptAccessItem {
  id: string;
  label: string;
  phong_ban_id?: string | null;
}

export interface DeptAccessGroup {
  deptId: string;
  label: string;
  level: number;
  items: DeptAccessItem[];
}

const deptTreeOptions = {
  getId: (d: Department) => d.id,
  getParentId: (d: Department) => d.cha_id,
  getOrder: (d: Department) => d.thu_tu,
  includeOrphans: true as const,
};

function entityIdKey(value: string | number | null | undefined): string | null {
  if (value == null || value === '') return null;
  return String(value);
}

/**
 * Gom item theo phòng ban (DFS cây phòng). Chỉ trả về group có ≥1 item trực tiếp.
 * Bucket `__none__` cho item chưa gán phòng.
 */
export function buildDeptAccessGroups(
  departments: Department[],
  items: DeptAccessItem[],
  unassignedLabel: string,
): DeptAccessGroup[] {
  const byDept = new Map<string, DeptAccessItem[]>();

  for (const item of items) {
    const deptId = entityIdKey(item.phong_ban_id) ?? DEPT_ACCESS_UNASSIGNED_KEY;
    const list = byDept.get(deptId) ?? [];
    list.push(item);
    byDept.set(deptId, list);
  }

  for (const list of byDept.values()) {
    list.sort((a, b) => a.label.localeCompare(b.label, getLanguage()));
  }

  const groups: DeptAccessGroup[] = [];
  const flatDepts = flattenTreeToSortedList(departments, deptTreeOptions);

  for (const dept of flatDepts) {
    const deptId = String(dept.id);
    const direct = byDept.get(deptId);
    if (!direct?.length) continue;
    groups.push({
      deptId,
      label: dept.ten_phong_ban,
      level: dept.cap_do,
      items: direct,
    });
  }

  const unassigned = byDept.get(DEPT_ACCESS_UNASSIGNED_KEY);
  if (unassigned?.length) {
    groups.push({
      deptId: DEPT_ACCESS_UNASSIGNED_KEY,
      label: unassignedLabel,
      level: 1,
      items: unassigned,
    });
  }

  return groups;
}

/** Id item thuộc subtree phòng (phòng + cấp con). `__none__` chỉ trả item trong bucket đó. */
export function getSubtreeItemIds(
  departments: Department[],
  items: DeptAccessItem[],
  deptId: string,
): string[] {
  if (deptId === DEPT_ACCESS_UNASSIGNED_KEY) {
    return items
      .filter((item) => entityIdKey(item.phong_ban_id) == null)
      .map((item) => item.id);
  }

  const subtree = getDepartmentSubtreeIds(departments, [deptId]);
  return items
    .filter((item) => {
      const pb = entityIdKey(item.phong_ban_id);
      return pb != null && subtree.has(pb);
    })
    .map((item) => item.id);
}
