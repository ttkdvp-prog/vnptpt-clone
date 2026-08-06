# Phase 2.5 Report — Business Foundation Hardening

**Ngày:** 2026-07-16  
**Phạm vi:** Docs / contracts / freeze only  
**Không làm:** Rewrite kiến trúc · migrate module · đổi UI · đổi business logic · Generic component mới · Remove runtime files

Nguồn inventory: [`business-foundation-audit.md`](./business-foundation-audit.md)

---

## 1. Audit snapshot (đóng gói)

| Vai trò audit | Implementation | Đánh giá Phase 2.5 |
|---------------|----------------|--------------------|
| Factories | `lib/factories/` (`createFeatureModule`, flat, hierarchy) | API ổn định; giữ nguyên |
| GenericTable / Pagination | `GenericTable` + `PageSizeSelect`; Hierarchy: `TablePaginationFooter` | Hai surface theo Page Pattern — canonical trong docs |
| GenericToolbar / Filter / Search | `GenericToolbar` + `FilterChip*` + column-header | Props nhất quán; hybrid filter = grandfathered |
| GenericDrawer | `GenericDrawer` + `FormDrawerFooter` | Stable |
| GenericDetail | Composition: `DetailSection` / `DetailField` / `DetailToolbar` / `DetailSystemSection` | Không invent `GenericDetail.tsx` |
| GenericForm | Composition: `FormSection` / `FormGrid` / `RhfDataField` / `FormStepper` | Không invent `GenericForm.tsx` |
| GenericDialog / Import / Export | `ConfirmDialog`, `AppDialog`, `ImportDialog`, `ExportDialog` | Stable |
| GenericStats | `components/shared/stats/*` | Adopt `StatsCard` cho module mới |
| GenericDashboard | `ModuleDashboardLayout` + `SubModuleCard` | Stable |

**Naming:** Giữ `Generic*` — không rename ERP*.  
**Trùng chức năng:** Orphans đã quyết định Adopt/Deprecate (dưới).  
**Không dùng / orphan:** Đã chốt — không để trạng thái mơ hồ.

---

## 2. Component đã chuẩn hóa (contract documented)

Contracts mirror Props hiện có — xem [`component-catalog.md`](./component-catalog.md) + tóm tắt [`business-foundation.md`](./business-foundation.md).

| Block | Contract cốt lõi |
|-------|------------------|
| `GenericTable` | columns, data, loading, selection, pagination, renderCell/MobileCard, keyExtractor, empty |
| `GenericToolbar` | search, selection, filters/filterGroups, activeFilterCount, actions/bulk, column manager |
| `GenericDrawer` | title, onClose, children, footer, stackLevel, overlayTier |
| Detail stack | Summary → DetailToolbar → sections → children → DetailSystemSection last |
| Form stack | FormSection/Grid + Zod + FormDrawerFooter; mới: RhfDataField |
| `ImportDialog` / `ExportDialog` | open, columns, handlers/data |
| Stats | StatsKpiGrid, StatsDataGrid, StatsDrillDownDialog, StatsCard |

Không tạo `*.contract.ts` / không đổi `interface *Props`.

---

## 3. Adopt / Deprecate / Keep

### Adopt (module mới)

| Component | Ghi chú |
|-----------|---------|
| `RhfDataField` / `DataField` | Bắt buộc form mới |
| `FormStepper` | Khi ≥ 2 bước |
| `FilterChipSingleSelect` | Filter đơn giá trị |
| `StatsCard` / `StatsTableCard` | Shell chart / bảng 2 cột stats |
| `GenericSubTableSection` | Bảng con đơn giản |
| Barrel `@/components/views` | Import chuẩn |

### Deprecate

| Component | Ghi chú |
|-----------|---------|
| `PositionPermissionPicker` | Zero feature consumer; PQ frozen — **giữ file**, cấm dùng mới |

### Keep (stable — không đổi)

Factories, `GenericTable`, `Hierarchy*`, `GenericToolbar`, `GenericDrawer`, Detail/Form sections, Import/Export/Confirm, Stats đang dùng trên NV, Dashboard, `Can`/guards, Empty/Loading/Error, `EmbeddedChildDataGrid`, column-header, row-actions, `ListToolbarActions`, …

### Remove

**Không Remove** runtime trong Phase 2.5.

---

## 4. Contract đã thống nhất

Một nguồn sự thật: [`component-catalog.md`](./component-catalog.md).  
Role map ERP* → code: [`business-foundation.md`](./business-foundation.md).

---

## 5. Catalog hoàn thiện

| Doc | Trạng thái |
|-----|------------|
| [`business-foundation.md`](./business-foundation.md) | Cập nhật — contracts, orphan, freeze |
| [`component-catalog.md`](./component-catalog.md) | **Mới** — full catalog B |
| [`page-pattern.md`](./page-pattern.md) | **Mới** — A–E + debt |
| [`module-standard.md`](./module-standard.md) | Cập nhật — patterns + Adopt rules |
| [`checklist-module.md`](./checklist-module.md) | Cập nhật — non-hybrid, views barrel, RhfDataField |
| [`shared-ui-catalog.md`](./shared-ui-catalog.md) | Link → component-catalog |
| [`UI-CONVENTIONS.md`](./UI-CONVENTIONS.md) | Bỏ reference stale `CapPhatThuHoiToolbar` |
| [`features/_template/README.md`](../features/_template/README.md) | Adopt list + doc links |
| [`AGENTS.md`](../AGENTS.md) | Link Phase 2.5 |

---

## 6. Page Patterns đã định nghĩa

| Pattern | Tên | Ví dụ |
|---------|-----|-------|
| **A** | CRUD List | Nhân viên |
| **B** | Hierarchy | Phòng ban; Chức vụ (UI) |
| **C** | Singleton | Thông tin công ty |
| **D** | Matrix | Phân quyền |
| **E** | Dashboard / Stats | System dashboard; tab thống kê NV |

Chi tiết: [`page-pattern.md`](./page-pattern.md).

---

## 7. Freeze

Business Foundation = **Stable**.

1. Không Generic* mới trừ ≥ 3 module cùng cần.  
2. Không refactor Generic* cho 1 module đặc biệt.  
3. Module mới ưu tiên blocks hiện có + đúng pattern.  
4. Đổi props public = breaking → ADR.

---

## 8. Grandfathered debt (cố ý chưa sửa code)

| Debt | Module | Module mới phải |
|------|--------|-----------------|
| Hybrid chip + column-header | NV, PB, CV | Chọn A **hoặc** B filter |
| Import `shared/*` bypass barrel | Features | `@/components/views` |
| Form không `RhfDataField` | Triad + CTY | Adopt RhfDataField |
| Bulk-edit thiếu FormDrawerFooter | NV | Dùng FormDrawerFooter |
| Charts hand-roll card | NV | StatsCard |
| Company custom sections | CTY | FormSection khi unfreeze |

---

## 9. Việc còn lại / đề xuất tiếp theo

| Thứ tự | Việc | Ghi chú |
|--------|------|---------|
| **BF-next-1** | Module mới đầu tiên theo contract | Chứng minh Adopt (RhfDataField, views barrel, non-hybrid) — domain hoặc master data |
| **BF-next-2** | Optional debt burn-down | Chỉ khi product cho phép · zero UI intent: bulk footer, StatsCard trên NV — **không bắt buộc** |
| **BF-next-3** | Enterprise thin | BulkActionBar / Audit timeline / Attachment — chỉ khi ≥3 nhu cầu hoặc product ép |
| **BF-next-4** | Power user | SavedView / AdvancedSearch — sau list lớn thật |

**Không** đề xuất rewrite triad hay tạo Generic mới ngay sau Phase 2.5.

---

## Verification

- [x] Chỉ diff docs + template README + AGENTS  
- [x] Không đổi `features/he-thong/**` runtime  
- [x] Không đổi `components/shared/**` behavior  
- [x] Output đủ: chuẩn hóa · deprecate · keep · contract · catalog · patterns · còn lại  

**Verdict:** Phase 2.5 Hardening **complete**. Foundation sẵn sàng làm nền cho module nghiệp vụ tiếp theo dưới quy tắc Freeze.
