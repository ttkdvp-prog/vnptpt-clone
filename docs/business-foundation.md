# Business Foundation

Generic, reusable ERP building blocks — **không chứa business logic**.

**Phase 2.5 = Stable (Hardening).** Không rename component; map tên “ERP*” → implementation hiện có.

| Tài liệu | Vai trò |
|----------|---------|
| [`component-catalog.md`](./component-catalog.md) | Mục đích / khi dùng / contract / orphan status |
| [`page-pattern.md`](./page-pattern.md) | Patterns A–E + grandfather debt |
| [`business-foundation-audit.md`](./business-foundation-audit.md) | Inventory audit (đầu vào Phase 2.5) |
| [`phase-2.5-report.md`](./phase-2.5-report.md) | Báo cáo hardening |
| [`module-list-ux-report.md`](./module-list-ux-report.md) | Báo cáo sâu chức năng trang chính module Hệ thống |
| [`checklist-module.md`](./checklist-module.md) | Gate module mới |
| [`module-standard.md`](./module-standard.md) | Chuẩn vertical slice |

**Canonical import (module mới):** `@/components/views`

---

## Role map

| Vai trò (tài liệu) | Implementation hiện có |
|--------------------|------------------------|
| ERPPage / list shell | `createFeatureModule` / `createFlatListFeatureModule` / `createHierarchyFeatureModule` (`lib/factories/`) |
| ERPPageHeader / breadcrumbs | `Breadcrumbs`, page titles trong feature / layout |
| ERPToolbar | `GenericToolbar` + `ListToolbarActions` |
| ERPFilterBar | `FilterChipMultiSelect` / `FilterChipSingleSelect` + `filterGroups` / column-header filters |
| ERPDataTable | `GenericTable` (flat); `HierarchyTable` / `HierarchyListShell` (cây) |
| ERPPagination | Flat: trong `GenericTable` (`PageSizeSelect`); Hierarchy/Stats: `TablePaginationFooter` |
| ERPCardView (mobile) | `MobileListCard` |
| ERPDetailDrawer | `GenericDrawer` + `DetailSection` / `DetailField` / `DetailToolbar` / `DetailSystemSection` |
| ERPForm | `FormSection` / `FormGrid` / `FormStepper` / `RhfDataField` + Zod `core/schema.ts` + `FormDrawerFooter` |
| ERPSection | `Section` / `FormSection` / `DetailSection` (`variant="primary"`) |
| ERPDeleteDialog | `ConfirmDialog` (global host trong AppShell) |
| ERPImportDialog | `ImportDialog` + `lib/import/` |
| ERPExportDialog | `ExportDialog` |
| ERPEmptyState | `EmptyState` |
| ERPLoading / skeleton | `ListPageSkeleton`, `TableSkeleton`, `CardListSkeleton`, `PageFallback` |
| ERP module dashboard | `ModuleDashboardLayout` + `SubModuleCard` |
| ERP stats | `stats/*`, `lib/stats-table.ts`, `lib/stats-date-range.ts` |

Chi tiết contract từng block: [`component-catalog.md`](./component-catalog.md).

---

## Contracts (tóm tắt)

Chuẩn hóa API = **tài liệu props** (mirror code). Không invent wrapper `GenericForm` / `GenericDetail` — chúng là **composition**.

| Block | Props / composition cốt lõi |
|-------|----------------------------|
| **GenericTable** | `columns`, `data`, `isLoading`, selection, `page`/`pageSize` + handlers, `renderCell`, `renderMobileCard`, `keyExtractor`, empty/loading text |
| **GenericToolbar** | `searchTerm`/`onSearchChange`, `selectedCount`, `filters`/`filterGroups`, `activeFilterCount`/`onClearAllFilters`, `actions`/`bulkActions`, column manager |
| **GenericDrawer** | `title`, **`icon` (bắt buộc Form/Detail)**, `onClose`, `children`, optional `subtitle`, `footer`, `stackLevel`, `overlayTier`, `footerCompact` — icon size `ICON_SIZE.prominent` (20) |
| **Detail stack** | Summary → `DetailToolbar` → `DetailSection`/`DetailField` → child tables → **`DetailSystemSection` last**; mỗi `DetailSection` **bắt buộc** `icon` (`ICON_SIZE.compact` / 14); mỗi `DetailField` nghiệp vụ **bắt buộc** `icon` (`ICON_SIZE.micro` / 12) từ `*-field-icons` |
| **Form stack** | `FormSection`/`FormGrid` + Zod + `FormDrawerFooter`; mỗi `FormSection` **bắt buộc** `icon` (14); mỗi control có label (`RhfDataField`/`Input`/…) **bắt buộc** `icon` cùng Lucide với detail (`*-field-icons` + `fieldIcon()`); module mới: **`RhfDataField`** + field-meta |
| **ImportDialog** | `open`, `onClose`, `columns`, `onImport` (+ lookup sheets) |
| **ExportDialog** | `open`, `onClose`, `columns`, `data`, `fileName` |
| **Stats** | `StatsKpiGrid` / `StatsDataGrid` / `StatsDrillDownDialog`; chart shell **`StatsCard`** (module mới) |

---

## Factories

| Factory | Khi dùng | Page Pattern |
|---------|----------|--------------|
| `createFeatureModule` | List + stats + CRUD | **A** |
| `createFlatListFeatureModule` | List phẳng / custom list component | **A** (hoặc B UI trên flat data) |
| `createHierarchyFeatureModule` | Cây parent–child | **B** |

Supporting: `createFilterCountsHook`, `createColumnSearchMatcher`.

**Không** ép Pattern C/D/E vào factory.

---

## Page Patterns

Xem [`page-pattern.md`](./page-pattern.md): **A** CRUD List · **B** Hierarchy · **C** Singleton · **D** Matrix · **E** Dashboard/Stats.

---

## Orphan decisions (Phase 2.5)

| Component | Decision |
|-----------|----------|
| `RhfDataField` / `DataField` | **Adopt** — bắt buộc form module mới |
| `FormStepper` | **Adopt** — khi form ≥ 2 bước |
| `FilterChipSingleSelect` | **Adopt** — filter đơn giá trị |
| `StatsCard` / `StatsTableCard` | **Adopt** — stats/chart module mới |
| `GenericSubTableSection` | **Adopt** — bảng con đơn giản |
| Barrel `@/components/views` | **Adopt** — import chuẩn module mới |
| `PositionPermissionPicker` | **Deprecate** — giữ file; không dùng mới |

Không **Remove** runtime component trong Phase 2.5.

---

## Stable / Freeze (sau Phase 2.5)

1. Business Foundation được xem là **Stable**.
2. **Không** thêm Generic component mới trừ khi **≥ 3 module** cùng cần cùng API.
3. **Không** refactor Generic* chỉ để phục vụ một module đặc biệt.
4. Mọi module mới ưu tiên blocks hiện có + đúng Page Pattern.
5. Đổi props public Generic* = breaking → cần ADR + lý do rõ.
6. Drift trên triad hiện tại = **grandfathered** — không migrate UI trong hardening; module mới không copy debt (xem `page-pattern.md`).

---

## Existing vs New modules (MUST)

| | Existing (NV / PB / CV / PQ / CTY …) | New modules |
|--|-------------------------------------|-------------|
| Grandfathered debt | **Được phép giữ** (hybrid filter, import `shared/*`, form không `RhfDataField`, …) | **Cấm copy** debt đó |
| Page Pattern | Có thể lệch catalog lịch sử | **MUST** chọn đúng A–E trước khi code |
| Filter surface | Hybrid chip + header chấp nhận | **MUST** chỉ **một** surface: Chip **hoặc** Header (XOR) |
| Import foundation | Có thể còn `@/components/shared/*` | **MUST** `@/components/views` |
| Form | Có thể Controller/Input thô | **MUST** `RhfDataField` + field-meta |
| Reference code | Triad = reference hành vi nghiệp vụ | Reference **pattern** từ docs + template — **không** copy file UI lệch guideline |

Gate: [`checklist-module.md`](./checklist-module.md) · debt list: [`page-pattern.md`](./page-pattern.md) § Grandfathered.

---

## Registries

- View types: `lib/view-types/`
- Data types: `lib/data-types/`
- Last-view flow: `lib/last-view-flow.ts`

---

## Module mới

1. Chọn Page Pattern ([`page-pattern.md`](./page-pattern.md))
2. Copy [`features/_template/`](../features/_template/README.md)
3. Wire factory (nếu A/B) + import từ `@/components/views`
4. Form: `RhfDataField` + field-meta; filter: Pattern A **hoặc** B (không hybrid)
5. Checklist: [`checklist-module.md`](./checklist-module.md)
6. Permissions: [`patterns-permissions.md`](./patterns-permissions.md)

## Không làm trong foundation

- Logic FK / validate nghiệp vụ cụ thể (`features/*/services` + schema)
- Hardcode resource name Employee/Customer
- Thêm Generic* dưới ngưỡng 3-module
- Rewrite / migrate module hiện có chỉ để “cho giống catalog”
