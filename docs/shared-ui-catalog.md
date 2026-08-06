# Shared UI catalog

Phân loại component hiện có (A primitives · B shared · C feature).

**Deep catalog (purpose / when / contract / orphan status):** [`component-catalog.md`](./component-catalog.md)  
**Foundation Stable (Phase 2.5):** [`business-foundation.md`](./business-foundation.md) · [`page-pattern.md`](./page-pattern.md)

Import CRUD foundations: `@/components/views` (barrel). Không đổi public API Generic* trừ ADR.

---

## A. Primitives (`components/ui/`)

Pattern shadcn-like (project-owned, không dùng shadcn CLI).

| Component | File |
|-----------|------|
| Button | `Button.tsx` |
| Input, Textarea, FormField | `Input.tsx`, `Textarea.tsx`, `FormField.tsx` |
| Combobox, AsyncCombobox, MultiSelect, ParentSelect | `Combobox.tsx`, … |
| Date / time | `DatePicker`, `DateRangePicker`, `DateTimeInput`, `TimeInput`, `MonthYearPicker` |
| Domain inputs | `CurrencyInput`, `PhoneInput`, `EmailInput`, `PercentInput`, `UrlInput`, `NumericFormatInput`, `NumberStepper` |
| Media | `SingleImageInput`, `MultiImageInput`, `ImageLightbox`, `PreviewableImage`, `FileInput` |
| Feedback / chrome | `Tooltip`, `TabGroup`, `RadioGroup`, `ToggleSwitch`, `StatusToggle`, `EnumBadge` |
| Mobile sheets | `MobileActionsSheet`, `MobileFilterSheet` |
| Misc | `ColorPickerInput`, `ChartTooltip` |

**Quy tắc:** Tiếp tục dùng; chỉ sửa khi cần tương thích Next hoặc type-safe.

---

## B. Custom shared (ERP patterns)

### `components/shared/`

| Category | Examples |
|----------|----------|
| Table | `GenericTable`, `HierarchyTable`, `TablePaginationFooter`, `ColumnManager`, `column-header/*`, `row-actions/*` |
| Toolbar / filter | `GenericToolbar`, `FilterChipMultiSelect`, `FilterChipSingleSelect`, `ListToolbarActions`, `DashboardToolbar` |
| Drawer / dialog | `GenericDrawer`, `AppDialog`, `ConfirmDialog`, `ImportDialog`, `ExportDialog` |
| Form / detail | `FormSection`, `FormGrid`, `FormStepper`, `DetailSection`, `DetailField`, `DetailToolbar`, `DetailSystemSection`, `Section` |
| Stats | `stats/*` (`StatsDataGrid`, `StatsTableCard`, `StatsDrillDownDialog`, …) |
| Feedback | `EmptyState`, `ErrorBoundary`, `ErrorState`, skeletons, `LoadingSpinnerWithText` |
| Other | `Breadcrumbs`, `EmbeddedChildDataGrid`, `HierarchyListShell`, `PwaRegister` |

### `components/dashboard/`

`ModuleDashboardLayout`, `SubModuleCard`, `MainCard`

### `components/data-types/`

`DataField`, `RhfDataField` — bridge `DataTypeId` → widget

### `components/layout/`

`Layout` (sidebar/header), `MobileBottomNav`, `CommandPalette`

### `components/auth/`

`ProtectedRoute`, `ModulePermissionRoute`, `Can`, session/permission synchronizers

### `components/placeholder/`

`ComingSoonLayout`, `ModulePlaceholder`

### `components/notification/`

Bell, dropdown, items

---

## C. Business components (`features/*/components/`)

Ví dụ: `nhan-vien-form`, `phong-ban-table`, `phan-quyen` matrix UI.

- **Không** đưa vào Shared UI.
- Giữ trong module domain.
- Phase 3 migrate module = tái sử dụng A + B, viết/giữ C trong feature.

---

## Anti-patterns

- Không tạo lại Button/Dialog nếu đã có.
- Không đưa EmployeeCard / ProductDrawer vào `components/shared`.
- Không hardcode menu trong component — dùng config nav ([`navigation.md`](./navigation.md)).
