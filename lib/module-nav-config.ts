import type { LucideIcon } from 'lucide-react';
import { Building, Shield, Users } from 'lucide-react';
import type { AppResource } from '@/lib/permissions';
import { CONG_VIEC_MODULE_NAV_GROUPS } from '@/lib/cong-viec-nav-config';

export interface SystemModuleNavItem {
  resource: AppResource;
  path: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  color: string;
}

export interface SystemModuleNavGroup {
  groupTitleKey: string;
  items: SystemModuleNavItem[];
}

/** Submenu Hệ thống — dùng chung dashboard, command palette, route guard. */
export const SYSTEM_MODULE_NAV_GROUPS: SystemModuleNavGroup[] = [
  {
    groupTitleKey: 'page.systemDashboard.orgChartGroup',
    items: [
      {
        resource: 'employees',
        path: '/he-thong/nhan-vien',
        titleKey: 'page.systemDashboard.employee',
        descriptionKey: 'page.systemDashboard.employeeDesc',
        icon: Users,
        color: 'bg-emerald-500',
      },
    ],
  },
  {
    groupTitleKey: 'page.systemDashboard.securityGroup',
    items: [
      {
        resource: 'company',
        path: '/he-thong/thong-tin-cong-ty',
        titleKey: 'page.systemDashboard.companyInfo',
        descriptionKey: 'page.systemDashboard.companyInfoDesc',
        icon: Building,
        color: 'bg-violet-500',
      },
      {
        resource: 'permissions',
        path: '/he-thong/phan-quyen',
        titleKey: 'page.systemDashboard.permission',
        descriptionKey: 'page.systemDashboard.permissionDesc',
        icon: Shield,
        color: 'bg-rose-500',
      },
    ],
  },
];

const PATH_TO_RESOURCE = new Map<string, AppResource>([
  ...SYSTEM_MODULE_NAV_GROUPS.flatMap((g) =>
    g.items.map((item) => [item.path, item.resource] as const),
  ),
  ...CONG_VIEC_MODULE_NAV_GROUPS.flatMap((g) =>
    g.items
      .filter((item) => item.resource)
      .map((item) => [item.path, item.resource as AppResource] as const),
  ),
]);

export function getAppResourceForPath(path: string): AppResource | undefined {
  const exact = PATH_TO_RESOURCE.get(path);
  if (exact) return exact;
  // Trang hướng dẫn: /…/module/huong-dan dùng cùng resource với module cha
  if (path.endsWith('/huong-dan')) {
    return PATH_TO_RESOURCE.get(path.slice(0, -'/huong-dan'.length));
  }
  return undefined;
}

export function hasAnySystemModuleAccess(
  canAccess: (resource: AppResource) => boolean
): boolean {
  return SYSTEM_MODULE_NAV_GROUPS.some((group) =>
    group.items.some((item) => canAccess(item.resource))
  );
}
