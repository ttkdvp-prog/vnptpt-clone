# Phase 2 report — Enterprise Architecture

Ngày hoàn thành: 2026-07-16  
Nguyên tắc: Architecture First, Reuse First, Rewrite Last — **không** migrate module nghiệp vụ, **không** đổi UI/UX/business logic.

---

## 1. Đã chuẩn hóa

| Hạng mục | Việc đã làm |
|----------|-------------|
| Folder map | [`docs/folder-structure.md`](./folder-structure.md) — ideal ↔ path thực tế; không tạo `shared/`/`styles/` root trùng |
| Design System | [`docs/design-system.md`](./design-system.md) — inventory tokens hiện có |
| Shared UI | [`docs/shared-ui-catalog.md`](./shared-ui-catalog.md) — A/B/C |
| Business Foundation | [`docs/business-foundation.md`](./business-foundation.md) — map ERP* → Generic* |
| Providers | Move → [`providers/`](../providers/) |
| Config | [`config/`](../config/) re-export env / data-source / nav |
| Layout | [`app/(auth)/layout.tsx`](../app/(auth)/layout.tsx); auth pages trong `(auth)/` |
| Navigation | [`docs/navigation.md`](./navigation.md); Layout đã dùng config + permission filter |
| Module template | [`features/_template/`](../features/_template/) |
| Providers doc | [`docs/providers.md`](./providers.md) |
| Conventions | Cập nhật `coding-convention.md`, `AGENTS.md`, `.cursor/rules/05-architecture.mdc` |
| Checklist | Trỏ `_template` + foundation |

---

## 2. Component được tái sử dụng (không rewrite)

- **A. Primitives:** toàn bộ `components/ui/*` (Button, Input, Combobox, DatePicker, …)
- **B. Shared ERP:** `GenericTable`, `GenericDrawer`, `GenericToolbar`, `ConfirmDialog`, `ImportDialog`, `ExportDialog`, `FormSection`, `DetailSection`, `FilterChip*`, stats/*, factories `createFeatureModule*`
- **Shell:** `Layout`, `ProtectedRoute`, `ModulePermissionRoute`, `ModuleDashboardLayout`
- **Data:** TanStack Query + Zustand + existing he-thong services

---

## 3. Component / file được refactor (nhẹ)

| Thay đổi | Lý do |
|----------|--------|
| `components/providers/*` → `providers/*` | Chuẩn hóa vị trí Providers; đã gỡ re-export tạm |
| `app/layout.tsx` + feature pages import `@/providers` | Wire canonical path |
| Auth pages → `app/(auth)/` | Auth layout group (URL không đổi) |
| Docs mới / cập nhật | Catalog + convention Phase 2 |

**Không** đổi props/API UI. **Không** rename Generic* → ERP*.

---

## 4. Cần migrate / mở rộng ở Phase 3

| Module / domain | Ghi chú |
|-----------------|---------|
| Hệ thống (đã có) | Nhân viên, phòng ban, chức vụ, công ty, phân quyền — **đã chạy**; Phase 3 có thể harden API/auth server-side, không “migrate từ Vite” lại |
| CRM / Khách hàng | Roadmap — dùng `_template` + foundation |
| Kho / Inventory | Roadmap |
| Mua hàng / Bán hàng | Roadmap |
| Tài liệu | Roadmap |
| Dashboard & báo cáo tổng hợp | Mở rộng stats patterns hiện có |

---

## 5. Rủi ro còn tồn tại

| Rủi ro | Ghi chú |
|--------|---------|
| Hono-on-Next tạm | Contract `lib/api` ổn; Server Actions thay REST là Phase sau |
| Dual `mock` \| `api` | Cần giữ parity service khi thêm module |
| `views/` vs `app/` | Hai lớp screen — document rõ; tránh logic trong `page.tsx` |
| Lazy pages trong AppShell | Feature pages lazy từ `providers/app-shell` — OK nhưng coupling providers↔features |
| Badge sidebar | Chưa có field badge trên `MenuItem` |
| PWA | Stub `PwaRegister` — chưa Serwist đầy đủ |

---

## 6. Checklist xác nhận Phase 2

- [x] Kiến trúc thư mục được map + scaffold (`providers/`, `config/`, `_template/`)
- [x] Design System documented (tokens giữ nguyên)
- [x] Shared UI catalog A/B/C
- [x] Business Foundation map (không rename)
- [x] Layout Root / Auth / Dashboard
- [x] Navigation config-driven + docs
- [x] Providers chuẩn hóa vị trí + docs
- [x] Module template sẵn sàng Phase 3
- [x] Coding convention / AGENTS / architecture rule cập nhật
- [x] Không tạo CRUD / API / module Employee|Customer|Product mới
- [x] Verify: `tsc` · `test` · `build` (chạy sau báo cáo)

---

## Đề xuất tiếp theo (Phase 3)

1. Harden server authorization trên Hono routes (parity client matrix).
2. Migrate domain mới theo `_template` (ưu tiên CRM hoặc domain business ưu tiên).
3. Tách lazy page registry khỏi `providers/app-shell` nếu coupling gây khó scale.
4. Optional: sidebar badge API khi có thông báo chưa đọc.
5. PWA Serwist khi product yêu cầu offline.
