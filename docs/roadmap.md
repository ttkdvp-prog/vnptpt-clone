# Roadmap

Lộ trình phát triển Trung tâm hạ tầng (cập nhật theo tiến độ thực tế).

## Phase 1 — Nền tảng ✅

- Next.js 16 App Router + React 19 + TypeScript
- PostgreSQL + Prisma (thay stack Supabase trước đó)
- Auth.js Credentials (đăng nhập nhân viên)
- Hono Route Handlers nhúng Next
- Docker Compose (app + Postgres)
- UI shell: layout, dark mode, command palette, permissions nav

## Phase 2 — Enterprise Architecture ✅

- Folder map, Design System docs, Shared UI catalog, Business Foundation map
- `providers/`, `config/`, `features/_template/`
- Auth layout `(auth)/`, navigation docs
- Báo cáo: [`phase-2-report.md`](./phase-2-report.md)
- ADR: [`adr/`](./adr/) · Module standard: [`module-standard.md`](./module-standard.md)

## Phase 3 — Vertical slice (Hệ thống trước) ⏳

**Một module hoàn chỉnh 100% rồi mới sang module tiếp theo** — không parallel CRM.

| Slice | Module | Trạng thái |
|-------|--------|------------|
| 3.1 | Nhân viên | ✅ Done (backend harden + module doc) |
| 3.2 | Phòng ban | ✅ Done (backend harden + module doc) |
| 3.3 | Chức vụ | ✅ Done (backend harden + status persist) |
| 3.4 | Công ty / Phân quyền harden | ✅ Done (server RBAC + Zod; UI frozen) |

Chuẩn: [`module-standard.md`](./module-standard.md). Không rewrite UI/Foundation.

## Phase 4 — Domain mới (sau Hệ thống Done) ⏳

| Module | Mục tiêu |
|--------|----------|
| CRM | Khách hàng, liên hệ, pipeline |
| Kho (Inventory) | Danh mục hàng, tồn, xuất nhập |
| Mua hàng | Đề nghị / đơn mua / nhà cung cấp |
| Bán hàng | Đơn hàng, giao hàng, hóa đơn |
| Tài liệu | Quản lý văn bản / đính kèm |

Mỗi module mới: `_template` + module-standard checklist + permissions + API Prisma.

## Phase 5 — Báo cáo & vận hành ⏳

- Dashboard tổng hợp đa module
- Báo cáo xuất PDF/XLSX mở rộng
- Audit log / lịch sử thao tác
- PWA / offline (nếu cần)
