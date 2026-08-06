/** Re-export navigation config — source of truth: `lib/module-nav-config` + `lib/sidebar-menu`. */
export {
  type SystemModuleNavItem,
  type SystemModuleNavGroup,
  SYSTEM_MODULE_NAV_GROUPS,
  getAppResourceForPath,
  hasAnySystemModuleAccess,
} from '@/lib/module-nav-config';

export {
  type DomainModuleNavItem,
  type DomainModuleNavGroup,
  KINH_DOANH_MODULE_NAV_GROUPS,
} from '@/lib/kinh-doanh-nav-config';

export {
  type AdminOpsModuleNavItem,
  type AdminOpsModuleNavGroup,
  HANH_CHINH_MODULE_NAV_GROUPS,
} from '@/lib/hanh-chinh-nav-config';

export { type MenuItem, SIDEBAR_MENU, getSidebarMenuItem } from '@/lib/sidebar-menu';
