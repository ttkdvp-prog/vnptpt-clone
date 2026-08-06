# Feature module template

Copy this folder to `features/<domain>/<entity>/` when starting a **new** module (Phase 3+).

Do **not** wire routes from this template until the module is ready.

**References (read in order):**

1. [`docs/page-pattern.md`](../../docs/page-pattern.md) — chọn A/B/C/D/E  
2. [`docs/business-foundation.md`](../../docs/business-foundation.md) — Stable / Freeze  
3. [`docs/component-catalog.md`](../../docs/component-catalog.md) — contracts + Adopt/Deprecate  
4. [`docs/module-standard.md`](../../docs/module-standard.md) · [`docs/checklist-module.md`](../../docs/checklist-module.md)  
5. Implementation reference: `features/he-thong/nhan-vien/` (A) · `phong-ban/` (B)

## Ideal names → this repo

| Ideal (generic enterprise) | This project |
|----------------------------|--------------|
| `schemas/` | `core/schema.ts` |
| `types/` | `core/types.ts` |
| `constants/` | `core/constants.ts` |
| `repository/` | `server/repositories/<entity>.ts` (Prisma) |
| `actions/` | Hono `server/routes/<entity>.ts` + `app/<entity>/[[...path]]/route.ts` |
| `views/` (feature screens) | `components/` + optional `pages/` + `*.module.tsx` |
| `routes.ts` | Path constants for App Router + nav |
| `permissions.ts` | `AppResource` notes + checklist link |

## Business Foundation (Phase 2.5 — Adopt) — MUST

Module **mới** **MUST**:

1. Chọn đúng **Page Pattern** (A–E) trước khi scaffold — [`docs/page-pattern.md`](../../docs/page-pattern.md).
2. Import UI foundation từ `@/components/views` (không deep-import `shared/*` cho blocks đã barrel).
3. Form: `RhfDataField` + `core/*-field-meta.ts`.
4. Filter: **một** surface — Pattern A (chip) **XOR** Pattern B (header) — **không hybrid**.
5. Stats (nếu có): `StatsCard` / `StatsTableCard` cho shell chart/bảng 2 cột.
6. Multi-step form: `FormStepper` + `FormDrawerFooter.steps`.
7. **Không** dùng `PositionPermissionPicker` (deprecated).

**Existing modules** (NV/PB/CV/…) được phép giữ grandfathered debt.  
**New modules MUST NOT** copy implementation lệch guideline từ module cũ — chỉ tham khảo nghiệp vụ / factory wiring đúng docs (`business-foundation.md` § Existing vs New).

## Vertical slice

Hoàn thành checklist trong [`docs/module-standard.md`](../../docs/module-standard.md) trước khi đánh dấu Done.

## Steps

1. Chọn Page Pattern (A–E)
2. `cp -R features/_template features/<domain>/<entity>`
3. Rename stubs; fill `core/types.ts`, `core/schema.ts`, field-meta
4. Prisma model + migration + `server/repositories/`
5. Hono routes + server permission
6. `services/` + hooks (TanStack Query) + Zustand UI store
7. Wire UI: factory (nếu A/B) + `@/components/views`
8. Add `app/(app)/…/page.tsx`, nav item in `lib/module-nav-config.ts`
9. Tests + `docs/modules/<entity>.md`

## Imports

- Cross-folder: `@/…` only
- Within entity: relative `./` / `../` OK
- Foundation blocks: `@/components/views`
