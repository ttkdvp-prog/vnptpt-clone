# Navigation

Menu is **config-driven**. Do not hardcode sidebar items inside `Layout.tsx`.

## Sources of truth

| Config | Path | Role |
|--------|------|------|
| Top-level sidebar | [`lib/sidebar-menu.tsx`](../lib/sidebar-menu.tsx) (`SIDEBAR_MENU`) | Home, Tổng quan (+ Live TV tại `/tong-quan/tv`), Hành chính, Kinh doanh, Sản xuất, Hệ thống, Bản quyền |
| System submenu | [`lib/module-nav-config.ts`](../lib/module-nav-config.ts) (`SYSTEM_MODULE_NAV_GROUPS`) | Dashboard cards, command palette, route→resource |
| Admin ops submenu | [`lib/hanh-chinh-nav-config.ts`](../lib/hanh-chinh-nav-config.ts) (`HANH_CHINH_MODULE_NAV_GROUPS`) | Dashboard cards + command palette; danh sách / thống kê tài liệu `documentList`; thiết lập tài liệu `documentSettings` |
| Business submenu | [`lib/kinh-doanh-nav-config.ts`](../lib/kinh-doanh-nav-config.ts) (`KINH_DOANH_MODULE_NAV_GROUPS`) | Dashboard cards + command palette; KH `customers`, NLH `contacts`, thiết lập `customerSettings` |
| Production submenu | [`lib/san-xuat-nav-config.ts`](../lib/san-xuat-nav-config.ts) (`SAN_XUAT_MODULE_NAV_GROUPS`) | Dashboard cards + command palette (placeholder) |
| Permission filter | [`hooks/use-filtered-sidebar-menu.ts`](../hooks/use-filtered-sidebar-menu.ts) | Hides `/he-thong` if no module access; always shows license |
| Command palette | [`lib/command-palette-entries.ts`](../lib/command-palette-entries.ts) | Derived from domain groups + fixed entries |
| Barrel | [`config/nav.ts`](../config/nav.ts) | Re-export for Phase 2 entry point |

## Shell

[`components/layout/Layout.tsx`](../components/layout/Layout.tsx) consumes `useFilteredSidebarMenu()` only — icons/labels from config + `txt()`.

Route guards: `ModulePermissionRoute` + `getAppResourceForPath()`.

## Contract (extend in Phase 3+)

| Capability | Status |
|------------|--------|
| Multi-level | Sidebar L1 (`SIDEBAR_MENU`) + L2 groups (`SYSTEM_MODULE_NAV_GROUPS` on system dashboard) |
| Icon | `LucideIcon` on each item |
| Permission | `resource: AppResource` + `canAccessModule` / `hasAnySystemModuleAccess` |
| Active route | Layout matches `pathname` to `item.path` |
| Badge | Not on sidebar yet — add optional `badge?: string \| number` on `MenuItem` when needed (no UI change in Phase 2) |

## Adding a module to nav

1. Register `AppResource` + matrix module key.
2. Add item to `SYSTEM_MODULE_NAV_GROUPS`.
3. Add `app/(app)/…/page.tsx` + feature module.
4. Command palette picks up groups automatically if derived from config.

Do **not** edit Layout.tsx to add a one-off menu row.
