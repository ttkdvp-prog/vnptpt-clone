import type { LucideIcon } from 'lucide-react';
import { Users, ContactRound, Settings2 } from 'lucide-react';
import type { AppResource } from '@/lib/permissions';

/** Item module trong submenu domain. */
export interface DomainModuleNavItem {
  path: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  color: string;
  /** Khi set — lọc theo canAccessModule trên dashboard / route guard. */
  resource?: AppResource;
}

export interface DomainModuleNavGroup {
  groupTitleKey: string;
  items: DomainModuleNavItem[];
}

/** Submenu Kinh doanh — dashboard cards + command palette (placeholder). */
export const KINH_DOANH_MODULE_NAV_GROUPS: DomainModuleNavGroup[] = [
  {
    groupTitleKey: 'page.businessDashboard.customerGroup',
    items: [
      {
        path: '/kinh-doanh/khach-hang',
        titleKey: 'page.businessDashboard.customerList',
        descriptionKey: 'page.businessDashboard.customerListDesc',
        icon: Users,
        color: 'bg-emerald-500',
        resource: 'customers',
      },
      {
        path: '/kinh-doanh/nguoi-lien-he',
        titleKey: 'page.businessDashboard.contact',
        descriptionKey: 'page.businessDashboard.contactDesc',
        icon: ContactRound,
        color: 'bg-teal-500',
        resource: 'contacts',
      },
      {
        path: '/kinh-doanh/thiet-lap-khach-hang',
        titleKey: 'page.businessDashboard.customerSettings',
        descriptionKey: 'page.businessDashboard.customerSettingsDesc',
        icon: Settings2,
        color: 'bg-slate-500',
        resource: 'customerSettings',
      },
    ],
  },
];
