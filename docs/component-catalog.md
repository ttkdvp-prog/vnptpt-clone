# Business Component Catalog

Catalog chi tiết các building blocks ERP (lớp B).  
Phân loại tổng quát: [`shared-ui-catalog.md`](./shared-ui-catalog.md).  
Role map & freeze: [`business-foundation.md`](./business-foundation.md).  
Page patterns: [`page-pattern.md`](./page-pattern.md).

**Canonical import (module mới):** `@/components/views`  
**Status:** `stable` = đang dùng · `adopt` = bắt buộc/ưu tiên cho module mới · `deprecated` = không dùng mới

Contracts mirror Props hiện có — **không đổi public API** trong Phase 2.5.

---

## Factories (ERPPage shells)

### `createFeatureModule`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Shell list + tabs (list/stats) + CRUD drawers + Import/Export |
| **Khi dùng** | Page Pattern **A** cần stats (vd. Nhân viên) |
| **Khi không dùng** | Hierarchy thuần → `createHierarchyFeatureModule`; singleton/matrix → không factory |
| **Contract** | Config: query keys, hooks, `Toolbar`, `Table`, optional `Stats`, `Form`/`Detail`/`BulkEdit`, import/export columns |
| **Ví dụ** | `features/he-thong/nhan-vien/nhan-vien.module.tsx` |

### `createFlatListFeatureModule`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Shell list phẳng + CRUD + Import/Export (không ép `GenericTable`) |
| **Khi dùng** | Pattern **A** không stats, hoặc list + custom `ListComponent` (vd. Chức vụ + Hierarchy UI) |
| **Khi không dùng** | Cây parent/child thật → hierarchy factory |
| **Contract** | `ListComponent`, `Toolbar`, form/detail, services, confirm mutations |
| **Ví dụ** | `features/he-thong/chuc-vu/` |

### `createHierarchyFeatureModule`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Shell cây + stacked drawers + Import/Export |
| **Khi dùng** | Page Pattern **B** (Phòng ban) |
| **Khi không dùng** | Flat list không quan hệ cha–con |
| **Contract** | Hierarchy list, child navigation, `stackLevel` drawers |
| **Ví dụ** | `features/he-thong/phong-ban/` |

Supporting: `createFilterCountsHook`, `createColumnSearchMatcher` (`lib/factories/`).

---

## Table / list

### `GenericTable`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Bảng CRUD flat + selection + pagination + mobile cards |
| **Khi dùng** | Pattern **A** flat (Nhân viên) |
| **Khi không dùng** | Cây / nhóm hierarchy → `HierarchyTable` |
| **Contract (bắt buộc)** | `data`, `columns`, `isLoading`, `selectedIds`, `onToggleSelection`, `onToggleAll`, `page`, `pageSize`, `onPageChange`, `onPageSizeChange`, `renderCell`, `renderMobileCard`, `keyExtractor` |
| **Contract (tùy chọn)** | `sort`/`onSort`, `onRowClick`, `density`, `enableVirtualScroll`, `emptyTitle`/`emptyDescription`, `loadingText`, `totalRecordCount`, `serverPaginated`, column header accessories |
| **Ví dụ** | ```ts<br>import { GenericTable } from '@/components/views';``` |

### `HierarchyTable` + `HierarchyListShell`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Bảng cây/nhóm + pagination footer + empty/loading |
| **Khi dùng** | Pattern **B**; hoặc flat data hiển thị theo nhóm (Chức vụ) |
| **Khi không dùng** | List phẳng đơn giản → `GenericTable` |
| **Contract** | Shell: data, columns, pagination, render row/card; Table: expand/collapse, sticky headers |
| **Pagination** | `TablePaginationFooter` (canonical cho hierarchy) |

### `MobileListCard`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Card list trên mobile |
| **Khi dùng** | Mọi list CRUD có `renderMobileCard` |
| **Khi không dùng** | Màn không có list |

### `TablePaginationFooter` / `PageSizeSelect`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Phân trang + chọn page size |
| **Khi dùng** | Hierarchy / Stats: `TablePaginationFooter`; Flat `GenericTable` nhúng `PageSizeSelect` |
| **Khi không dùng** | Không tự viết thanh phân trang mới |
| **Ghi chú** | Hai surface theo pattern — xem [`page-pattern.md`](./page-pattern.md) |

### `ColumnManager`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Bật/tắt / sắp xếp cột |
| **Khi dùng** | Qua `GenericToolbar` (`columns` + handlers) |
| **Khi không dùng** | Import trực tiếp từ feature (trừ custom) |

### `column-header/*` · `row-actions/*`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Search/filter/sort trên header; icon actions + overflow menu |
| **Khi dùng** | Pattern B filters; mọi row action CRUD |
| **Khi không dùng** | Tự viết dropdown action mới nếu đã có `DataTableRowActions` |

---

## Toolbar / filter / search

### `GenericToolbar`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Search + filters + bulk + column manager + mobile sheets |
| **Khi dùng** | Mọi Pattern **A/B** list |
| **Khi không dùng** | Singleton / matrix (dùng `DashboardToolbar` hoặc custom) |
| **Contract (bắt buộc)** | `selectedCount`, `searchTerm`, `onSearchChange`, `onClearSelection` |
| **Contract (tùy chọn)** | `filters`, `filterGroups`, `activeFilterCount`, `onClearAllFilters`, `actions`/`bulkActions`, column manager props, `hideSearch`, `onAdd`, `mobileActions` |
| **Ví dụ** | Feature `*-toolbar.tsx` bọc `GenericToolbar` + `ListToolbarActions` |

### `ListToolbarActions`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Nút Thêm / Import / Export chuẩn |
| **Khi dùng** | Slot `actions` của toolbar |
| **Khi không dùng** | Tự style button list actions lệch `lib/toolbar-list-actions.ts` |

### `FilterChipMultiSelect` / `FilterChipSingleSelect`

| | |
|--|--|
| **Status** | Multi: `stable` · Single: **`adopt`** |
| **Mục đích** | Chip filter desktop |
| **Khi dùng** | Pattern **A**; Multi = nhiều giá trị; Single = một giá trị |
| **Khi không dùng** | Pattern **B** cho cùng dimension đã chuyển xuống header (không hybrid trên module mới) |
| **Contract** | options, value, onChange, label; counts qua `createFilterCountsHook` |

### `ToolbarFilterChipGroup`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Nhóm chip trên toolbar |
| **Khi dùng** | Nhiều filter chip cạnh nhau |

### `DashboardToolbar`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Header trang không phải list CRUD (stats, profile, license) |
| **Khi dùng** | Pattern **E** / utility pages |
| **Khi không dùng** | List CRUD → `GenericToolbar` |

---

## Drawer / dialogs

### `GenericDrawer`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Drawer form/detail (slide phải) |
| **Khi dùng** | Form + Detail mọi Pattern A/B |
| **Khi không dùng** | Confirm nhỏ → `ConfirmDialog`; data preview → `AppDialog` |
| **Contract (bắt buộc)** | `title`, `onClose`, `children` |
| **Contract (tùy chọn)** | `subtitle`, `icon`, `footer`, `stackLevel`, `overlayTier`, `footerCompact`, `maxWidthClass`, `variant` |
| **Ví dụ** | ```ts<br>import { GenericDrawer } from '@/components/views';``` |

### `FormDrawerFooter`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Footer Hủy / Lưu|Thêm (+ multi-step) |
| **Khi dùng** | Mọi form drawer; bulk edit nên dùng (module mới) |
| **Khi không dùng** | Detail (dùng `DetailToolbar`) |
| **Contract** | `formId`, `onCancel`; optional `isLoading`, `isEdit`, `compact`, `steps` |

### `ConfirmDialog`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Xác nhận xóa / hủy / đổi trạng thái |
| **Khi dùng** | Qua `useConfirmStore` (global host AppShell) |
| **Khi không dùng** | Tự modal confirm mới |

### `AppDialog`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Modal data preview / drill-down host |
| **Khi dùng** | Stats drill-down, preview lớn |
| **Khi không dùng** | Form CRUD → drawer |

### `ImportDialog`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Import Excel + mapping + kết quả |
| **Khi dùng** | Pattern A/B khi nghiệp vụ có import (qua factory) |
| **Khi không dùng** | Singleton không import |
| **Contract** | `open`, `onClose`, `columns`, `onImport`; optional `lookupSheets`, `templateFileName` |

### `ExportDialog`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Export xlsx/csv/pdf theo scope |
| **Khi dùng** | Pattern A/B có export |
| **Contract** | `open`, `onClose`, `columns`, `data`, `fileName`; optional selected/page scopes |

---

## Form / detail / section

### `FormSection` / `FormGrid`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Section + lưới field form |
| **Khi dùng** | Mọi form CRUD; Singleton nên dùng khi unfreeze |
| **Khi không dùng** | Tự `h3` + card lệch `variant="primary"` |

### `FormStepper`

| | |
|--|--|
| **Status** | **`adopt`** |
| **Mục đích** | Form nhiều bước |
| **Khi dùng** | Form ≥ 2 bước (+ `FormDrawerFooter.steps`) |
| **Khi không dùng** | Form 1 bước |

### `RhfDataField` / `DataField`

| | |
|--|--|
| **Status** | **`adopt`** |
| **Mục đích** | Bridge `DataTypeId` → widget + RHF |
| **Khi dùng** | **Bắt buộc** form module **mới** + `*-field-meta.ts` |
| **Khi không dùng** | Không bắt migrate form triad hiện tại trong Phase 2.5 |
| **Ví dụ** | ```ts<br>import { RhfDataField } from '@/components/views';``` |

### `DetailSection` / `DetailField` / `DetailFieldGrid`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Khối hiển thị chi tiết |
| **Khi dùng** | Detail drawer |
| **Thứ tự** | Summary → `DetailToolbar` → sections → child tables → **`DetailSystemSection` last** |

### `DetailToolbar` / `DetailSystemSection`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Actions sửa/xóa; audit `tg_tao` / `tg_cap_nhat` / `nguoi_tao` |
| **Khi dùng** | Mọi detail entity có audit fields |

### `Section`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Section title primary (utility pages) |
| **Khi dùng** | License, notification; base của Form/Detail section |

### `GenericSubTableSection`

| | |
|--|--|
| **Status** | **`adopt`** |
| **Mục đích** | Bảng con đơn giản trong detail |
| **Khi dùng** | Child list đơn giản, chiều cao theo `lib/detail-sub-table.ts` |
| **Khi không dùng** | Grid giàu (sticky/virtual) → `EmbeddedChildDataGrid` |

### `EmbeddedChildDataGrid`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Data grid con trong detail |
| **Khi dùng** | VD nhân sự theo phòng ban |
| **Khi không dùng** | Bảng 2–3 cột đơn giản → `GenericSubTableSection` |

---

## Stats

### `StatsKpiGrid` / `StatsTrendBadge`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | KPI cards + trend |
| **Khi dùng** | Tab thống kê Pattern A/E |

### `StatsDataGrid`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Bảng aggregate nhiều cột (max 10 rows viewport) |
| **Khi dùng** | Stats tables phức tạp |
| **Khi không dùng** | Full `GenericTable` cho aggregate |

### `StatsDrillDownDialog`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Drill-down từ chart/KPI |
| **Khi dùng** | Click stats → list records; detail dùng `overlayTier="aboveDataDialog"` |

### `StatsCard` / `StatsTableCard`

| | |
|--|--|
| **Status** | **`adopt`** |
| **Mục đích** | Shell card chart; bảng 2 cột stats |
| **Khi dùng** | Module stats **mới** — không hand-roll `bg-card rounded-xl border…` |
| **Khi không dùng** | Không bắt Nhân viên đổi charts trong Phase 2.5 |

---

## Dashboard / navigation / security / feedback

### `ModuleDashboardLayout` / `SubModuleCard`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Dashboard nhóm module |
| **Khi dùng** | Pattern **E** (System dashboard) |

### `Breadcrumbs`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Đường dẫn + `getParentPath` |
| **Khi dùng** | Layout / back navigation |

### `Can` / route guards

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | UI permission gate |
| **Khi dùng** | Mọi action theo [`patterns-permissions.md`](./patterns-permissions.md) |
| **Khi không dùng** | `User.role` cho authorization |

### `PositionPermissionPicker`

| | |
|--|--|
| **Status** | **`deprecated`** |
| **Mục đích** | (Cũ) chọn chức vụ cho phân quyền |
| **Khi dùng** | **Không** dùng mới — Phân quyền UI frozen custom |
| **Khi không dùng** | Mọi module mới |
| **Ghi chú** | Giữ file; unfreeze security UI mới xem xét lại |

### `EmptyState` / skeletons / `ErrorState` / `LoadingSpinnerWithText`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Feedback loading / empty / error |
| **Khi dùng** | List, stats, pages — không invent empty UI mới |

### `ComingSoonLayout`

| | |
|--|--|
| **Status** | `stable` |
| **Mục đích** | Placeholder submenu |
| **Khi dùng** | Module chưa có UI |

---

## Orphan summary (Phase 2.5)

| Component | Decision |
|-----------|----------|
| `RhfDataField` / `DataField` | **Adopt** |
| `FormStepper` | **Adopt** (khi ≥2 bước) |
| `FilterChipSingleSelect` | **Adopt** |
| `StatsCard` / `StatsTableCard` | **Adopt** |
| `GenericSubTableSection` | **Adopt** |
| `@/components/views` barrel | **Adopt** |
| `PositionPermissionPicker` | **Deprecate** (giữ file, không Remove) |
