# Module Standard

Chuẩn một module ERP trong repo này. **Phase 3 = vertical slice**: hoàn thành **100% một module** rồi mới sang module tiếp theo.

Xem thêm: [`checklist-module.md`](./checklist-module.md) · [`page-pattern.md`](./page-pattern.md) · [`business-foundation.md`](./business-foundation.md) · [`component-catalog.md`](./component-catalog.md) · [`features/_template/`](../features/_template/) · [`adr/`](./adr/).

**Business Foundation = Stable (Phase 2.5).** Module mới bám foundation hiện có; không invent Generic* dưới ngưỡng 3-module.

**Existing vs new:** module hiện có (triad Hệ thống, …) **được phép** giữ grandfathered debt. Module **mới MUST**: đúng Page Pattern; một filter surface (Chip XOR Header); import `@/components/views`; form `RhfDataField`. Chi tiết: [`business-foundation.md`](./business-foundation.md) § Existing vs New · [`page-pattern.md`](./page-pattern.md).

## Ideal folder → This repo

| Ideal (enterprise) | Path trong repo |
|--------------------|-----------------|
| `components/` | `features/<domain>/<entity>/components/` |
| `views/` | `components/` + `*.module.tsx` + optional `pages/` |
| `hooks/` | `features/.../hooks/` |
| `schemas/` | `core/schema.ts` |
| `types/` | `core/types.ts` |
| `constants/` | `core/constants.ts` |
| `repository/` | `server/repositories/<entity>.ts` (Prisma) |
| `services/` | `features/.../services/` (client: mock \| api) |
| `actions/` | Hono `server/routes/<entity>.ts` + `app/<entity>/[[...path]]/route.ts` |
| `permissions.ts` | Feature stub + `lib/permissions.ts` / matrix |
| `routes.ts` | Feature path constants + App Router page |
| `index.ts` | Feature public export |

**Không** đưa business components vào `components/shared`.

## Vertical slice checklist (Done = đủ hết)

- [ ] Prisma model
- [ ] Migration / SQL apply
- [ ] Repository (server Prisma)
- [ ] Service (client mock \| api)
- [ ] Validation schema (Zod) — client + server
- [ ] Route Handlers (Hono)
- [ ] Permission — client **và** server
- [ ] List view
- [ ] Card view (mobile, nếu module có list)
- [ ] Detail drawer
- [ ] Create form
- [ ] Edit form
- [ ] Delete
- [ ] Search
- [ ] Filter
- [ ] Sort
- [ ] Pagination (server-side khi `NEXT_PUBLIC_DATA_SOURCE=api`)
- [ ] Import (nếu nghiệp vụ có)
- [ ] Export (nếu nghiệp vụ có)
- [ ] Audit (`nguoi_tao`, `tg_tao`, `tg_cap_nhat`) khi entity có
- [ ] Tests
- [ ] Module documentation (`docs/modules/<entity>.md`)

## Phase 3 order (cố định)

1. **Nhân viên** (`nhan-vien`) — Phase 3.1  
2. **Phòng ban** — Phase 3.2  
3. **Chức vụ** — Phase 3.3  
4. Công ty / Phân quyền harden  
5. Domain mới (CRM, Kho, …) chỉ sau Hệ thống Done  

## Page Pattern trước khi code UI

| Pattern | Khi nào | Factory |
|---------|---------|---------|
| **A** CRUD List | Nhiều bản ghi + drawers | `createFeatureModule` / `createFlatListFeatureModule` |
| **B** Hierarchy | Cây / nhóm hierarchy | `createHierarchyFeatureModule` (+ Hierarchy shell) |
| **C** Singleton | Một bản ghi cấu hình | Không — page form |
| **D** Matrix | Ma trận 2 trục | Không — custom (UI frozen nếu PQ) |
| **E** Dashboard/Stats | Nhóm menu / KPI | `ModuleDashboardLayout` / stats suite |

Chi tiết: [`page-pattern.md`](./page-pattern.md).

## Quy tắc

1. Không làm song song nhiều module “nửa vời”.
2. Không rewrite UI frozen (Công ty / Phân quyền) / không đổi public API Generic* trừ ADR.
3. Module **mới**: import `@/components/views`; form dùng `RhfDataField` + field-meta; filter Pattern A **hoặc** B (không hybrid).
4. API mode: service **không** fetch-all rồi slice — gọi page API.
5. Copy từ `features/_template/` khi tạo module **mới** (CRM+).
6. Không thêm Generic component mới trừ khi ≥ 3 module cùng cần (freeze Phase 2.5).

## Reference module

- Pattern A + stats: [`docs/modules/nhan-vien.md`](./modules/nhan-vien.md) / `features/he-thong/nhan-vien/`
- Pattern B: `features/he-thong/phong-ban/` · Chức vụ (flat + hierarchy UI): `features/he-thong/chuc-vu/`
- Không copy grandfathered debt (hybrid filter, bypass `RhfDataField`) — xem `page-pattern.md`.
