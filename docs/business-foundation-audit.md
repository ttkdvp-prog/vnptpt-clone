# Business Foundation Audit

**Ngày:** 2026-07-16  
**Phạm vi:** Toàn bộ repo ERP (không sửa code / UI / business logic / migrate module)  
**Nguồn đối chiếu:** `docs/business-foundation.md`, `docs/shared-ui-catalog.md`, `docs/view-types.md`, `docs/UI-CONVENTIONS.md`, `components/shared|views|dashboard|auth|data-types`, `lib/factories/`, `features/he-thong/*`

---

## Tóm tắt điều hành

Kiến trúc Business Foundation **đã có xương sống rõ** (factories + Generic* + Detail/Form/Stats + Import/Export). Ba module CRUD (Nhân viên · Phòng ban · Chức vụ) dùng cùng pattern; hai màn đặc thù (Phân quyền · Công ty) nằm ngoài list-CRUD là hợp lý.

Điểm nghẽn chính không phải thiếu component thô, mà là:

1. **Adoption lệch catalog** — nhiều primitive đã có nhưng chưa dùng (`RhfDataField`, `FormStepper`, `StatsCard`, barrel `@/components/views`).
2. **Consistency debt nhỏ** trong triad CRUD (hybrid filter chip + column header, pagination footer khác nhau).
3. **Một số ERP enterprise pattern còn thiếu** (SavedView, Timeline/Audit feed, BulkActionToolbar chuẩn, AttachmentViewer…).

**Khuyến nghị:** hoàn thiện Foundation (adoption + chuẩn hóa) **trước** khi mở rộng domain nghiệp vụ mới.

---

## 1. Inventory — Business Components hiện có

### 1.1 Lớp shell / page (factories)

| Component / factory | Vị trí | Module dùng | Trùng lặp? |
|---------------------|--------|-------------|------------|
| `createFeatureModule` | `lib/factories/create-feature-module.tsx` | `nhan-vien` | Không |
| `createFlatListFeatureModule` | `lib/factories/create-flat-list-feature-module.tsx` | `chuc-vu` | Không |
| `createHierarchyFeatureModule` | `lib/factories/create-hierarchy-feature-module.tsx` | `phong-ban` | Không |
| `createFilterCountsHook` | `lib/factories/createFilterCountsHook.ts` | nv / cv / pb | Không |
| `createColumnSearchMatcher` | `lib/factories/createColumnSearchMatcher.ts` | nv / cv / pb | Không |
| `createGenericStore` | `store/createGenericStore.ts` | nv / cv / pb stores | Không |

Map tài liệu (`docs/business-foundation.md`): **ERPPage** ≈ các factory trên.

### 1.2 Table / list

| Component | Vị trí | Module dùng | Trùng lặp? |
|-----------|--------|-------------|------------|
| `GenericTable` | `components/shared/GenericTable.tsx` | `nhan-vien` | Không (chỉ flat list) |
| `HierarchyTable` | `components/shared/HierarchyTable.tsx` | `phong-ban`, `chuc-vu` | Không |
| `HierarchyListShell` | `components/shared/HierarchyListShell.tsx` | `phong-ban`, `chuc-vu` | Không |
| `MobileListCard` | `components/shared/MobileListCard.tsx` | nv / cv / pb | Không |
| `TablePaginationFooter` | `components/shared/TablePaginationFooter.tsx` | Hierarchy shell, Stats | Một phần chồng với `PageSizeSelect` trong `GenericTable` |
| `PageSizeSelect` | `components/shared/PageSizeSelect.tsx` | `GenericTable`, Hierarchy, Stats | OK (primitive) |
| `ColumnManager` | `components/shared/ColumnManager.tsx` | Qua `GenericToolbar` | Không |
| `column-header/*` | `components/shared/column-header/` | nv / cv / pb lists | Không |
| `row-actions/*` | `components/shared/row-actions/` | `*-table-row-actions` ×3 | Thin wrappers — chấp nhận được |

### 1.3 Toolbar / filter

| Component | Vị trí | Module dùng | Trùng lặp? |
|-----------|--------|-------------|------------|
| `GenericToolbar` | `components/shared/GenericToolbar.tsx` | nv / cv / pb toolbars | Không |
| `ListToolbarActions` | `components/shared/ListToolbarActions.tsx` | nv / cv / pb | Không |
| `FilterChipMultiSelect` | `components/shared/FilterChipMultiSelect.tsx` | nv / cv / pb (+ stats) | Không |
| `FilterChipSingleSelect` | `components/shared/FilterChipSingleSelect.tsx` | **Chưa có consumer** | Catalog orphan |
| `ToolbarFilterChipGroup` | `components/shared/ToolbarFilterChipGroup.tsx` | nv / cv / pb | Không |
| `DashboardToolbar` | `components/shared/DashboardToolbar.tsx` | `nhan-vien-stats`, Profile, LicenseInfo | Công ty tự viết header tương tự |

### 1.4 Drawer / dialog

| Component | Vị trí | Module dùng | Trùng lặp? |
|-----------|--------|-------------|------------|
| `GenericDrawer` | `components/shared/GenericDrawer.tsx` | nv / cv / pb form+detail; bulk-edit | Không |
| `FormDrawerFooter` | `components/shared/FormDrawerFooter.tsx` | nv / cv / pb forms | Bulk-edit NV tự nút Save/Cancel |
| `AppDialog` | `components/shared/AppDialog.tsx` | Qua `StatsDrillDownDialog` | Không |
| `ConfirmDialog` | `components/shared/ConfirmDialog.tsx` | Global `AppShell` + `useConfirmStore` | Không |
| `ImportDialog` | `components/shared/ImportDialog.tsx` | 3 factories (nv/cv/pb) | Không |
| `ExportDialog` | `components/shared/ExportDialog.tsx` | 3 factories | Không |

### 1.5 Form / detail / section

| Component | Vị trí | Module dùng | Trùng lặp? |
|-----------|--------|-------------|------------|
| `FormSection` / `FormGrid` | `components/shared/` | nv / cv / pb forms | Công ty **không** dùng — tự card/`h3` |
| `FormStepper` | `components/shared/FormStepper.tsx` | **Chưa dùng** | Catalog orphan |
| `Section` | `components/shared/Section.tsx` | LicenseInfo, Notification; base của Form/Detail | Không |
| `DetailSection` / `DetailField` / `DetailFieldGrid` | `components/shared/` | nv / cv / pb detail; Profile | Không |
| `DetailToolbar` | `components/shared/DetailToolbar.tsx` | nv / cv / pb; Profile | Không |
| `DetailSystemSection` | `components/shared/DetailSystemSection.tsx` | nv / cv / pb (đúng thứ tự cuối) | Không |
| `DataField` / `RhfDataField` | `components/data-types/` | **Chưa dùng trong features** | Field-meta tồn tại nhưng forms dùng Input/Controller thô |
| `GenericSubTableSection` | `components/shared/` | **Chưa dùng** | Orphan |
| `EmbeddedChildDataGrid` | `components/shared/` | `phong-ban-detail` | Không |

### 1.6 Stats

| Component | Vị trí | Module dùng | Trùng lặp? |
|-----------|--------|-------------|------------|
| `StatsKpiGrid` / `StatsTrendBadge` | `components/shared/stats/` | `nhan-vien-stats` | Không |
| `StatsDataGrid` | `components/shared/stats/` | `nhan-vien-stats` | Không |
| `StatsDrillDownDialog` | `components/shared/stats/` | `nhan-vien-stats` | Không |
| `StatsCard` / `StatsTableCard` | `components/shared/stats/` | **Chưa dùng** | `EmployeeStatsCharts` tự vẽ card chrome |

### 1.7 Dashboard / navigation / security / feedback

| Component | Vị trí | Module dùng | Trùng lặp? |
|-----------|--------|-------------|------------|
| `ModuleDashboardLayout` / `SubModuleCard` | `components/dashboard/` | `SystemDashboard` | Không |
| `MainCard` | `components/dashboard/` | Home | Không |
| `ComingSoonLayout` / placeholders | `components/placeholder/` | Dashboard khi rỗng; placeholder routes | Ít wire vào `app/` |
| `Breadcrumbs` / `getParentPath` | `components/shared/Breadcrumbs.tsx` | Layout, company, phan-quyen, preview | Không |
| `Can` / `ProtectedRoute` / `ModulePermissionRoute` | `components/auth/` | Routes + CRUD permissions | Không |
| `PositionPermissionPicker` | `components/shared/` | **Chưa có runtime consumer** | Orphan |
| `EmptyState` | `components/shared/` | Tables, phong-ban-detail, Stats | Không |
| Skeletons / `LoadingSpinnerWithText` / `ErrorState` | `components/shared/` | App chrome + stats + phan-quyen | Không |

### 1.8 Barrel `@/components/views`

`components/views/index.ts` re-export foundation theo nhóm view-type.  
**Thực tế:** features import `@/components/shared/*` trực tiếp — **barrel chưa được adoption**.

### 1.9 Feature-local Business Components (domain, không phải foundation)

| Module | Components | Ghi chú |
|--------|------------|---------|
| `nhan-vien` | toolbar, table, form, detail, stats, bulk-edit, row-actions, charts, KPI config… | Reference CRUD đầy đủ nhất |
| `phong-ban` | toolbar, list, form, detail, row-actions | Hierarchy + child grid |
| `chuc-vu` | toolbar, list, form, detail, row-actions | Flat data + hierarchy UI |
| `phan-quyen` | `permission-matrix` | Custom; UI frozen |
| `thong-tin-cong-ty` | form + page | Singleton; UI frozen |

### 1.10 Module map

| Module | Shell | Foundation coverage |
|--------|-------|---------------------|
| Nhân viên | `createFeatureModule` | Cao (list+stats+import/export) |
| Chức vụ | `createFlatListFeatureModule` | Cao |
| Phòng ban | `createHierarchyFeatureModule` | Cao |
| Phân quyền | Hand-rolled | Thấp (đúng loại UI) |
| Thông tin công ty | Hand-rolled | Thấp (đúng loại UI) |
| chi-nhanh / cap-bac | Data-only | N/A |
| `_template` | Scaffold rỗng UI | Chưa encode pattern |

---

## 2. Missing Components — so với ERP Enterprise chuẩn

Đã có (hoặc gần đủ) so với checklist enterprise:

| Enterprise pattern | Hiện trạng |
|--------------------|------------|
| DataTable + ColumnManager | Có |
| Toolbar + filters | Có |
| Detail / Form drawer | Có |
| Confirm / Import / Export | Có |
| Empty / Loading / Error | Có |
| Stats KPI + drill-down | Có (NV) |
| Permission guard | Có (`Can`, route guards, hooks) |
| Module dashboard | Có |

**Còn thiếu hoặc chỉ partial** (ưu tiên theo nhu cầu ERP nội bộ 5F):

| Missing / weak | Mức độ | Ghi chú |
|----------------|--------|---------|
| **SavedView / View presets** | Thiếu | Lưu filter + cột + sort theo user |
| **AdvancedSearch / Query builder** | Thiếu | Multi-field AND/OR; hiện chỉ global search + chips + column search |
| **BulkActionToolbar** chuẩn | Partial | Có bulk-edit NV nhưng footer/actions chưa generic |
| **FilterPanel** (side panel) | Partial | Có chips + mobile sheet; chưa panel desktop nâng cao |
| **Timeline / ActivityFeed** | Thiếu | Lịch sử thao tác trên record |
| **AuditPanel** | Partial | Chỉ `DetailSystemSection` (tg_tao / tg_cap_nhat / nguoi_tao) |
| **AttachmentViewer / DocumentPanel** | Partial | Có media upload primitives; chưa viewer/panel chuẩn trên detail |
| **CommentThread** | Thiếu | Cộng tác trên bản ghi |
| **NotificationInbox** (foundation) | Partial | Có `views/NotificationPage` + notification components; chưa gắn record |
| **PrintPreview / DocumentDialog** | Partial | NV có profile print; chưa generic |
| **LookupDialog / EntityPicker** chuẩn | Partial | Combobox/AsyncCombobox; chưa modal multi-select entity chuẩn |
| **Wizard / multi-step form shell** | Partial | `FormStepper` tồn tại, chưa module nào dùng |
| **Kanban / Calendar / Map views** | Planned | Đã ghi trong `view-types.md` |
| **Split master-detail page** (không drawer) | Partial | Master-detail qua drawer + sub-table; chưa split pane |
| **Global Command actions cho CRUD** | Partial | `CommandPalette` navigation; chưa action registry theo module |

Không bắt buộc làm hết trước Phase domain mới — chọn theo roadmap §7.

---

## 3. Reusability

### 3.1 Đánh giá theo component

| Component | Generic đủ? | Có business logic? | Dùng mọi module? | Module tự viết lại? |
|-----------|-------------|--------------------|------------------|---------------------|
| Factories (`create*FeatureModule`) | Cao | Không (orchestration UI) | CRUD list yes; singleton/matrix no | Không |
| `GenericToolbar` | Cao | Không | CRUD yes | PQ/CTY khác loại UI |
| `GenericTable` | Cao | Không | Flat list | Hierarchy dùng shell khác |
| `HierarchyTable` + shell | Cao | Không | Tree / grouped | `chuc-vu-list` ≈ `phong-ban-list` (cấu trúc gần giống) |
| `GenericDrawer` | Cao | Không | Có | Không |
| `FormSection` / `FormGrid` | Cao | Không | CRUD yes | **CTY** tự section |
| `RhfDataField` / field-meta | Thiết kế đủ, **adoption 0** | Không | Mục tiêu mọi form | Forms tự `Controller`+Input |
| `FormStepper` | Có API | Không | Chưa | — |
| `Detail*` stack | Cao | Không | CRUD yes | Không |
| `ImportDialog` / `ExportDialog` | Cao | Logic import trong `lib/import/` (đúng chỗ) | CRUD factories | Không |
| `ConfirmDialog` | Cao | Không | Global | Không |
| `FilterChip*` | Cao | Không | CRUD; SingleSelect unused | PQ: `DeptFilterDropdown` custom |
| `Stats*` | Cao | Không | Chỉ NV có stats | Charts tự card thay `StatsCard` |
| `Can` / permission hooks | Cao | Policy ở hooks/docs | Có | Không lạm dụng `User.role` |
| `ColumnManager` | Cao | Không | Qua toolbar | Không |
| `EmbeddedChildDataGrid` | Cao | Không | PB | `GenericSubTableSection` orphan |

### 3.2 Kết luận reusability

- Foundation **đủ generic** cho CRUD list ERP nội bộ.
- Vấn đề chính là **under-adoption** và **copy-paste wiring** (toolbar chips, `column-search.ts` ×3, row-actions ×3) chứ không phải thiếu abstraction lớn.
- Domain components trong `features/*/components` **đúng chỗ** — không nên kéo lên shared.

---

## 4. Consistency

### 4.1 Ma trận (CRUD triad + 2 special)

| Khía cạnh | Nhân viên | Phòng ban | Chức vụ | Phân quyền | Công ty |
|-----------|:---------:|:---------:|:-------:|:----------:|:-------:|
| Toolbar `GenericToolbar` + chips | ✅ | ✅ | ✅ | ❌ custom | ❌ N/A |
| Drawer `GenericDrawer` | ✅ | ✅ | ✅ | — | — |
| Form `FormGrid`/`FormSection` | ✅ | ✅ | ✅ | — | ❌ |
| `RhfDataField` / FormStepper | ❌ | ❌ | ❌ | — | ❌ |
| Detail: Summary→Toolbar→Sections→System | ✅ | ✅ | ✅ | — | — |
| DataTable behavior | `GenericTable` | `HierarchyTable` | `HierarchyTable` | Matrix | — |
| Pagination UI | `PageSizeSelect` trong table | `TablePaginationFooter` | `TablePaginationFooter` | — | — |
| Search | Global + column | Global + column | Global + column | Custom | — |
| Filter | Chips **và** header (hybrid) | Hybrid | Hybrid | Custom dropdown | — |
| Import/Export | ✅ factory | ✅ | ✅ | — | — |
| Stats tab | ✅ chuẩn | — | — | — | — |
| Permissions hooks | ✅ | ✅ | ✅ | `useCan` | `useCan` |

### 4.2 Điểm thống nhất tốt

- Ba CRUD dùng factory + lazy form/detail + Import/Export.
- Detail order và `DetailSystemSection` cuối nhất quán.
- Permissions client theo `docs/patterns-permissions.md`.
- Stats NV bám `UI-CONVENTIONS` (date preset `all`, drill-down, KPI grid).

### 4.3 Drift cần ghi nhận (không sửa trong audit này)

1. **Hybrid Pattern A+B filters** — chips desktop vẫn bật song song column-header MultiSelect (checklist Pattern B muốn bỏ chips desktop khi đã có header).
2. **Pagination** — `GenericTable` vs `TablePaginationFooter` không cùng một surface API.
3. **NV form** không dùng `stackLevel` (factory unmount detail khi mở form — OK nhưng khác PB/CV).
4. **Bulk-edit** không dùng `FormDrawerFooter`.
5. **Công ty** lệch FormSection / `required` asterisk dù Zod có required.
6. Docs còn nhắc `CapPhatThuHoiToolbar` (module không có trong repo).

---

## 5. Component Hierarchy — kiến trúc chuẩn đề xuất

Giữ tên implementation hiện có; lớp trên là **vai trò** (đã map trong `business-foundation.md`). Không rename Phase hiện tại.

```
Business Foundation
│
├── ERPPage (factories)
│     createFeatureModule | createFlatListFeatureModule | createHierarchyFeatureModule
│
├── ERPPageHeader
│     Breadcrumbs · DashboardToolbar · page title (layout)
│
├── ERPToolbar
│     GenericToolbar · ListToolbarActions · ColumnManager
│
├── ERPFilterBar
│     FilterChipMultiSelect/SingleSelect · ToolbarFilterChipGroup
│     column-header/* · MobileFilterSheet (ui) · createFilterCountsHook
│
├── ERPContent
│     ├── ERPDataTable ...... GenericTable | HierarchyTable + HierarchyListShell
│     ├── ERPCardView ....... MobileListCard
│     └── ERPStatsPane ...... StatsKpiGrid · StatsDataGrid · StatsCard/TableCard · DrillDown
│
├── ERPDetailDrawer
│     GenericDrawer
│     ├── Summary card (feature)
│     ├── DetailToolbar
│     ├── DetailSection / DetailField / DetailFieldGrid
│     ├── EmbeddedChildDataGrid | GenericSubTableSection
│     └── DetailSystemSection (last)
│
├── ERPForm
│     GenericDrawer + FormDrawerFooter
│     FormSection · FormGrid · FormStepper
│     RhfDataField / DataField + Zod schema + field-meta
│
├── Dialogs
│     ConfirmDialog · ImportDialog · ExportDialog · AppDialog
│
├── Security
│     Can · ModulePermissionRoute · permission hooks
│
├── Dashboard
│     ModuleDashboardLayout · SubModuleCard · ComingSoonLayout
│
└── Utilities
      EmptyState · skeletons · createColumnSearchMatcher
      lib/import · lib/last-view-flow · lib/dialog-sizes
      view-types / data-types registries
```

**Quy tắc tầng:**

| Tầng | Được chứa | Không được chứa |
|------|-----------|-----------------|
| Foundation (`components/shared|views|…`, `lib/factories`) | Layout, wiring UI thuần | FK rules, tên entity cứng, API domain |
| Feature (`features/*/components`) | Form fields domain, columns, stats series | Copy lại GenericToolbar/Drawer từ đầu |
| App (`app/`, `views/`) | Route shell, dashboard tổng | Business CRUD logic |

---

## 6. Gap Analysis

### Giữ nguyên (keep)

- Ba factories + `createGenericStore`
- `GenericToolbar`, `GenericTable`, `Hierarchy*`, `GenericDrawer`
- Detail/Form section stack, `ConfirmDialog`, `ImportDialog`, `ExportDialog`
- Stats suite đã dùng trên NV
- Auth/`Can` + permission hooks
- `ModuleDashboardLayout`
- Registries `view-types` / `data-types`
- Domain components trong features

### Nên refactor (không đổi UI visible nếu tránh được)

- Thống nhất **pagination surface** giữa `GenericTable` và Hierarchy (`TablePaginationFooter`)
- Chuẩn hóa **filter strategy** (chọn Pattern A *hoặc* B trên desktop; giữ mobile `filterGroups`)
- NV **bulk-edit** → `FormDrawerFooter`
- Công ty (khi unfreeze): `FormSection`/`FormGrid` + `required` display
- Docs: bỏ reference module không tồn tại; cập nhật checklist vs reality `RhfDataField`

### Nên merge

- Wiring gần giống của `chuc-vu-list` / `phong-ban-list` → helper/factory list-shell nhỏ (nếu thêm hierarchy module thứ 3)
- Ba file `utils/column-search.ts` → dùng chung `createColumnSearchMatcher` + config cột (đã có factory; giảm copy)
- Chart card chrome → dùng `StatsCard` thay hand-roll

### Nên tách nhỏ

- `GenericToolbar` nếu tiếp tục phình (search / columns / actions / mobile) — tách sub-slots rõ hơn (đã có props; tránh God-component)
- `createFeatureModule` — tách rõ ListShell vs StatsShell vs DialogHost để module chỉ stats hoặc chỉ list dễ hơn

### Còn thiếu (ưu tiên đề xuất)

| Ưu tiên | Component | Lý do |
|---------|-----------|-------|
| P0 | Adoption `RhfDataField` + field-meta trên form mới | Catalog đã sẵn; giảm lệch widget |
| P0 | Bắt buộc import `@/components/views` cho module mới | Một cửa foundation |
| P1 | `BulkActionBar` generic | Mọi list CRUD sẽ cần |
| P1 | Audit/Timeline tối thiểu trên detail | ERP compliance |
| P2 | SavedView | Power users / list lớn |
| P2 | Attachment panel trên detail | Hồ sơ / chứng từ |
| P3 | AdvancedSearch, Kanban, Calendar | Theo `view-types` planned |

### Orphan cần quyết định (adopt hoặc deprecate có chủ đích)

- `FormStepper`, `FilterChipSingleSelect`, `GenericSubTableSection`, `PositionPermissionPicker`, `StatsCard`/`StatsTableCard`, barrel `@/components/views`

---

## 7. Báo cáo tổng hợp & Roadmap

### 7.1 Danh sách Business Components hiện có (rút gọn)

**Shell:** `createFeatureModule`, `createFlatListFeatureModule`, `createHierarchyFeatureModule`, filter/search factories, `createGenericStore`  

**List:** `GenericTable`, `HierarchyTable`, `HierarchyListShell`, `MobileListCard`, `TablePaginationFooter`, `ColumnManager`, column-header, row-actions  

**Toolbar/Filter:** `GenericToolbar`, `ListToolbarActions`, `FilterChip*`, `ToolbarFilterChipGroup`, `DashboardToolbar`  

**Overlay:** `GenericDrawer`, `FormDrawerFooter`, `AppDialog`, `ConfirmDialog`, `ImportDialog`, `ExportDialog`  

**Form/Detail:** `FormSection`, `FormGrid`, `FormStepper`, `DetailSection`, `DetailField`, `DetailFieldGrid`, `DetailToolbar`, `DetailSystemSection`, `Section`, `DataField`, `RhfDataField`, `EmbeddedChildDataGrid`, `GenericSubTableSection`  

**Stats:** `StatsKpiGrid`, `StatsCard`, `StatsTableCard`, `StatsDataGrid`, `StatsDrillDownDialog`, `StatsTrendBadge`  

**Dashboard/Nav/Security/Feedback:** `ModuleDashboardLayout`, `SubModuleCard`, `MainCard`, `Breadcrumbs`, `Can` + route guards, `EmptyState`, skeletons, `ComingSoonLayout`

### 7.2 Danh sách còn thiếu (rút gọn)

SavedView · AdvancedSearch · BulkActionToolbar chuẩn · Timeline/ActivityFeed · AuditPanel đầy đủ · AttachmentViewer · CommentThread · LookupDialog đa năng · PrintPreview generic · FilterPanel desktop · (planned) Calendar / Kanban / Map

### 7.3 Điểm mạnh

1. **Tách rõ** server state (Query) / UI state (Zustand) / services — foundation UI không nhồi business logic.
2. **Factories** rút ngắn bootstrap CRUD; triad NV/PB/CV chứng minh pattern chạy được.
3. **Conventions dày** (`UI-CONVENTIONS`, permissions, dialog/drawer sizes, stats table limits).
4. **Import/Export + Confirm global** đã chuẩn hóa.
5. **View-type / data-type registries** định hướng mở rộng có kiểm soát.
6. **Hierarchy + flat** đều có shell riêng — phù hợp org structure ERP VN.

### 7.4 Điểm yếu

1. Catalog **lệch adoption** (`RhfDataField`, barrel views, StatsCard, FormStepper…).
2. Consistency debt nhỏ nhưng sẽ nhân khi clone module (hybrid filter, pagination, bulk footer).
3. `_template` **chưa encode UI** — dễ copy lệch khỏi `nhan-vien`.
4. Feature vẫn import `@/components/shared` thay vì `@/components/views`.
5. Một số enterprise capability (audit trail UI, saved views) chưa có — chấp nhận được ở Phase 3.x nhưng cần roadmap trước khi scale domain.
6. Docs đôi chỗ stale (đã xử lý Phase 2.5: CapPhatThuHoiToolbar; checklist vs form → Adopt RhfDataField cho module mới).

### 7.5 Roadmap hoàn thiện Business Foundation

Không migrate module cũ hàng loạt. Mục tiêu: **module mới “đúng chuẩn ngay từ đầu”**.

| Phase | Mục tiêu | Việc cụ thể | Exit criteria |
|-------|----------|-------------|---------------|
| **BF-1 · Contract** | Chốt hợp đồng foundation | Cập nhật `business-foundation.md` + checklist: bắt buộc `@/components/views`; ghi rõ Pattern filter A vs B; orphan adopt/deprecate | Doc = source of truth khớp code |
| **BF-2 · Adoption kit** | Template thật | Bổ sung `_template` sample tối thiểu (toolbar/table/form/detail stubs) trỏ factory; ví dụ `RhfDataField` + field-meta | Module mới copy template không cần nhìn 3 chỗ |
| **BF-3 · Consistency hard** | Giảm drift triad | Chuẩn pagination API; quyết định chips vs header; bulk footer dùng `FormDrawerFooter`; Stats charts dùng `StatsCard` | Diff convention = 0 trên module mới |
| **BF-4 · Form bridge** | DataType → widget | Form module mới bắt buộc `RhfDataField`; migrate dần form cũ khi đụng tới | Không thêm `Controller`+Input thô trên field đã có DataType |
| **BF-5 · Enterprise thin** | Capability ERP tối thiểu | `BulkActionBar` generic; Audit/Timeline đọc-only trên detail; Attachment slot trên detail | Checklist module cập nhật § mới |
| **BF-6 · Power user** | Sau khi có ≥2 domain nghiệp vụ | SavedView; AdvancedSearch nếu list > ngưỡng cột/filter | Chỉ làm khi có use-case thật |

**Thứ tự trước khi mở module nghiệp vụ lớn (kho, bán hàng, kế toán…):** hoàn thành **BF-1 → BF-3** (bắt buộc), **BF-4** (khuyến nghị mạnh). BF-5/6 có thể song song với domain đầu tiên nếu cần.

### 7.6 Việc cố ý không làm trong audit này

- Không đổi UI / không refactor code / không migrate module
- Không rename Generic* → ERP*
- Không deprecate orphan ngay — chỉ liệt kê để quyết định ở BF-1

---

## Phụ lục A — Nguồn tham chiếu nhanh

| Tài liệu / code | Vai trò |
|-----------------|---------|
| `docs/business-foundation.md` | Role map ERP* → implementation |
| `docs/shared-ui-catalog.md` | Phân lớp A/B/C |
| `docs/view-types.md` | Trạng thái view type |
| `docs/checklist-module.md` | Gate module mới |
| `docs/UI-CONVENTIONS.md` | Dialog/drawer/toolbar/stats |
| `components/views/index.ts` | Barrel foundation |
| `lib/factories/` | ERPPage shells |
| `features/he-thong/nhan-vien/` | Reference implementation |

## Phụ lục B — Verdict một dòng

**Foundation đủ để scale CRUD nội bộ; hãy khóa contract + adoption + consistency nhỏ trước khi nhân bản sang domain nghiệp vụ — thiếu chủ yếu ở lớp enterprise collaboration/audit/saved-view, không phải ở GenericTable/Drawer.**
