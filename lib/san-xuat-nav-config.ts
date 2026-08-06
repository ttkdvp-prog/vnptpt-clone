import type { LucideIcon } from 'lucide-react';
import { FlaskConical, Gauge, Printer, Scissors } from 'lucide-react';
import type { AppResource } from '@/lib/permissions';

/** Item module trong submenu Sản xuất. */
export interface ProductionModuleNavItem {
  path: string;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  color: string;
  /** Khi set — lọc theo canAccessModule trên dashboard / route guard. */
  resource?: AppResource;
}

export interface ProductionModuleNavGroup {
  groupTitleKey: string;
  items: ProductionModuleNavItem[];
}

/** Submenu Sản xuất — dashboard cards. */
export const SAN_XUAT_MODULE_NAV_GROUPS: ProductionModuleNavGroup[] = [
  {
    groupTitleKey: 'page.productionDashboard.productionInfoGroup',
    items: [
      {
        path: '/san-xuat/danh-sach-market-in',
        titleKey: 'page.productionDashboard.printMarketList',
        descriptionKey: 'page.productionDashboard.printMarketListDesc',
        icon: Printer,
        color: 'bg-cyan-500',
        resource: 'printMarkets',
      },
      {
        path: '/san-xuat/thong-so-van-hanh-may-thoi',
        titleKey: 'page.productionDashboard.blowingMachineParams',
        descriptionKey: 'page.productionDashboard.blowingMachineParamsDesc',
        icon: Gauge,
        color: 'bg-blue-500',
      },
      {
        path: '/san-xuat/thong-so-van-hanh-may-cat',
        titleKey: 'page.productionDashboard.cuttingMachineParams',
        descriptionKey: 'page.productionDashboard.cuttingMachineParamsDesc',
        icon: Scissors,
        color: 'bg-orange-500',
      },
      {
        path: '/san-xuat/cong-thuc-tron-hat',
        titleKey: 'page.productionDashboard.pelletMixingFormula',
        descriptionKey: 'page.productionDashboard.pelletMixingFormulaDesc',
        icon: FlaskConical,
        color: 'bg-emerald-500',
      },
    ],
  },
];
