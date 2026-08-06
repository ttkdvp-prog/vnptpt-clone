import type { LucideIcon } from 'lucide-react';
import {
  Home as HomeIcon,
  Copyright,
  Layers,
  ClipboardList,
  Handshake,
  Factory,
  MonitorPlay,
} from 'lucide-react';

export interface MenuItem {
  path: string;
  nameKey: string;
  descriptionKey?: string;
  icon: LucideIcon;
  gradient: string;
}

/** Menu sidebar và thẻ Trang chủ — L1 modules (placeholder domain trước Hệ thống) */
export const SIDEBAR_MENU: MenuItem[] = [
  {
    path: '/',
    nameKey: 'nav.home',
    descriptionKey: 'page.home.systemModuleDesc',
    icon: HomeIcon,
    gradient: 'bg-gradient-to-br from-primary/90 to-primary',
  },
  {
    path: '/tong-quan',
    nameKey: 'nav.overview',
    descriptionKey: 'page.home.overviewModuleDesc',
    icon: MonitorPlay,
    gradient: 'bg-gradient-to-br from-zinc-700 to-zinc-900',
  },
  {
    path: '/hanh-chinh',
    nameKey: 'nav.adminOps',
    descriptionKey: 'page.home.adminOpsModuleDesc',
    icon: ClipboardList,
    gradient: 'bg-gradient-to-br from-amber-600 to-amber-800',
  },
  {
    path: '/san-xuat',
    nameKey: 'nav.production',
    descriptionKey: 'page.home.productionModuleDesc',
    icon: Factory,
    gradient: 'bg-gradient-to-br from-orange-600 to-orange-800',
  },
  {
    path: '/kinh-doanh',
    nameKey: 'nav.business',
    descriptionKey: 'page.home.businessModuleDesc',
    icon: Handshake,
    gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-800',
  },
  {
    path: '/he-thong',
    nameKey: 'nav.system',
    descriptionKey: 'page.home.systemModuleDesc',
    icon: Layers,
    gradient: 'bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700',
  },
  {
    path: '/thong-tin-ban-quyen',
    nameKey: 'nav.licenseInfo',
    descriptionKey: 'page.home.licenseInfoDesc',
    icon: Copyright,
    gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
  },
];

/** Lấy icon/meta menu L1 theo path (placeholder pages, dashboard). */
export function getSidebarMenuItem(path: string): MenuItem | undefined {
  return SIDEBAR_MENU.find((item) => item.path === path);
}