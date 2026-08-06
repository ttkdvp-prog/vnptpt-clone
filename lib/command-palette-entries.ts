import type { AppResource } from '@/lib/permissions';
import { HANH_CHINH_MODULE_NAV_GROUPS } from '@/lib/hanh-chinh-nav-config';
import { SYSTEM_MODULE_NAV_GROUPS } from '@/lib/module-nav-config';
import { KINH_DOANH_MODULE_NAV_GROUPS } from '@/lib/kinh-doanh-nav-config';
import { SAN_XUAT_MODULE_NAV_GROUPS } from '@/lib/san-xuat-nav-config';

/**
 * Các mục điều hướng nhanh cho Command Palette (Cmd/Ctrl+K).
 * `nameKey` tra qua `txt()` — giữ đồng bộ với nhãn sidebar / dashboard.
 */
export interface CommandPaletteEntry {
  path: string;
  nameKey: string;
  /** Key nhóm (hiển thị section trong palette) — `nav.commandPalette.group*` */
  groupKey: string;
  /** Khi set — lọc theo canAccessModule (bỏ qua nếu undefined). */
  resource?: AppResource;
}

const SYSTEM_PALETTE_ENTRIES: CommandPaletteEntry[] = SYSTEM_MODULE_NAV_GROUPS.flatMap(
  (group) =>
    group.items.map((item) => ({
      path: item.path,
      nameKey: item.titleKey,
      groupKey: 'nav.commandPalette.groupSystem',
      resource: item.resource,
    }))
);

const ADMIN_OPS_PALETTE_ENTRIES: CommandPaletteEntry[] = HANH_CHINH_MODULE_NAV_GROUPS.flatMap(
  (group) =>
    group.items.map((item) => ({
      path: item.path,
      nameKey: item.titleKey,
      groupKey: 'nav.commandPalette.groupAdminOps',
      resource: item.resource,
    }))
);

const BUSINESS_PALETTE_ENTRIES: CommandPaletteEntry[] = KINH_DOANH_MODULE_NAV_GROUPS.flatMap(
  (group) =>
    group.items.map((item) => ({
      path: item.path,
      nameKey: item.titleKey,
      groupKey: 'nav.commandPalette.groupBusiness',
      resource: item.resource,
    }))
);

const PRODUCTION_PALETTE_ENTRIES: CommandPaletteEntry[] = SAN_XUAT_MODULE_NAV_GROUPS.flatMap(
  (group) =>
    group.items.map((item) => ({
      path: item.path,
      nameKey: item.titleKey,
      groupKey: 'nav.commandPalette.groupProduction',
      resource: item.resource,
    }))
);

export const COMMAND_PALETTE_ENTRIES: readonly CommandPaletteEntry[] = [
  { path: '/', nameKey: 'nav.home', groupKey: 'nav.commandPalette.groupGeneral' },
  { path: '/tong-quan', nameKey: 'nav.overview', groupKey: 'nav.commandPalette.groupGeneral' },
  { path: '/tong-quan/tv', nameKey: 'overview.liveTv', groupKey: 'nav.commandPalette.groupGeneral' },
  { path: '/thong-tin-ban-quyen', nameKey: 'nav.licenseInfo', groupKey: 'nav.commandPalette.groupGeneral' },
  { path: '/hanh-chinh', nameKey: 'nav.adminOps', groupKey: 'nav.commandPalette.groupAdminOps' },
  ...ADMIN_OPS_PALETTE_ENTRIES,
  { path: '/san-xuat', nameKey: 'nav.production', groupKey: 'nav.commandPalette.groupProduction' },
  ...PRODUCTION_PALETTE_ENTRIES,
  { path: '/kinh-doanh', nameKey: 'nav.business', groupKey: 'nav.commandPalette.groupBusiness' },
  ...BUSINESS_PALETTE_ENTRIES,
  { path: '/he-thong', nameKey: 'nav.system', groupKey: 'nav.commandPalette.groupSystem' },
  ...SYSTEM_PALETTE_ENTRIES,
  { path: '/ho-so', nameKey: 'nav.profile', groupKey: 'nav.commandPalette.groupAccount' },
  { path: '/thong-bao', nameKey: 'nav.notification', groupKey: 'nav.commandPalette.groupAccount' },
] as const;
