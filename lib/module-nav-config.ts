import type { LucideIcon } from 'lucide-react';
import { Building, Briefcase, Shield, Users } from 'lucide-react';
import type { AppResource } from '@/lib/permissions';

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
        resource: 'departments',
        path: '/he-thong/phong-ban',
        titleKey: 'page.systemDashboard.department',
        descriptionKey: 'page.systemDashboard.departmentDesc',
        icon: Building,
        color: 'bg-indigo-500',
      },
      {
        resource: 'positions',
        path: '/he-thong/chuc-vu',
        titleKey: 'page.systemDashboard.position',
        descriptionKey: 'page.systemDashboard.positionDesc',
        icon: Briefcase,
        color: 'bg-blue-500',
      },
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
  ['/kinh-doanh/thiet-lap-khach-hang', 'customerSettings'],
  ['/kinh-doanh/khach-hang', 'customers'],
  ['/kinh-doanh/nguoi-lien-he', 'contacts'],
  ['/hanh-chinh/thiet-lap-tai-lieu', 'documentSettings'],
  ['/hanh-chinh/thiet-lap-cong-luong', 'payrollSettings'],
  ['/hanh-chinh/phieu-hanh-chinh', 'adminForms'],
  ['/hanh-chinh/thong-ke-phieu-hanh-chinh', 'adminForms'],
  ['/hanh-chinh/danh-sach-tai-lieu', 'documentList'],
  ['/hanh-chinh/thong-ke-tai-lieu', 'documentList'],
  ['/hanh-chinh/hop-dong', 'contracts'],
  ['/hanh-chinh/thong-bao', 'announcements'],
  ['/san-xuat/danh-sach-market-in', 'printMarkets'],
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
