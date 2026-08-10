import type { LucideIcon } from 'lucide-react';
import {
  Home as HomeIcon,
  Layers,
  ListTodo,
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
    path: '/cong-viec',
    nameKey: 'nav.workItems',
    descriptionKey: 'page.home.workItemsModuleDesc',
    icon: ListTodo,
    gradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
  },
  {
    path: '/he-thong',
    nameKey: 'nav.system',
    descriptionKey: 'page.home.systemModuleDesc',
    icon: Layers,
    gradient: 'bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700',
  },
];

/** Lấy icon/meta menu L1 theo path (placeholder pages, dashboard). */
export function getSidebarMenuItem(path: string): MenuItem | undefined {
  return SIDEBAR_MENU.find((item) => item.path === path);
}