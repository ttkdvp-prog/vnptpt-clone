# Trung tâm hạ tầng — Agent Instructions

> Vietnamese internal ERP/admin app (Next.js App Router). Cross-tool context for Cursor and other agents.

## Stack

React 19 · Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4  
Google Sheets API (data) + Google Drive API (ảnh upload) · Auth.js (Credentials) · TanStack Query v5 · Zustand · React Hook Form + Zod  
Framer Motion · Recharts · Lucide · Sonner · Sentry · Vercel

Dev: `npm run dev` (port 3000) · Mock: `NEXT_PUBLIC_DATA_SOURCE=mock` · API/Sheets: `NEXT_PUBLIC_DATA_SOURCE=api`  
Deploy: see `docs/deploy-vercel.md`

## Architecture

- **Feature-based modules** under `features/` (scaffold: `features/_template/`)
- **No `src/` folder** — paths use `@/*` alias
- **Routes:** App Router under `app/` — `(app)` dashboard, `(auth)` login; screens under `views/`
- **Providers:** `@/providers` (Theme sync, Auth.js session, Query, Sonner)
- **Config barrel:** `@/config` → re-exports env / data-source / nav
- **Server state:** TanStack Query in `features/*/hooks/` + keys in `lib/query-keys.ts`
- **Client UI state:** Zustand in `features/*/store/`
- **Data access:** Google Sheets API (`lib/sheets/`) via embedded Hono Route Handlers (`server/`) + feature services (`mock` | `api`)
- **Auth:** Auth.js (`auth.ts`) + Zustand hydrate via `AuthSessionSynchronizer`
- **Forms:** Zod in `features/*/core/schema.ts` + RHF + `zodResolver`
- **Navigation:** config-driven — `docs/navigation.md`
- **Query options:** `lib/query/query-config.ts`

## Project conventions (5F)

- Dialog sizes: `lib/dialog-sizes.ts`
- UI: `docs/UI-CONVENTIONS.md`, `docs/view-types.md`, `docs/design-system.md`
- Shared UI overview: `docs/shared-ui-catalog.md` · **Component catalog:** `docs/component-catalog.md`
- Business foundation (Stable Phase 2.5): `docs/business-foundation.md` · `docs/page-pattern.md` · `docs/phase-2.5-report.md`
- Audit inventory: `docs/business-foundation-audit.md`
- Module checklist: `docs/checklist-module.md` · template: `features/_template/`
- Permissions: `docs/patterns-permissions.md`
- Phase 2 report: `docs/phase-2-report.md`
- ADR: `docs/adr/` · Module standard: `docs/module-standard.md`
- Phase 3.1 Nhân viên: `docs/modules/nhan-vien.md`
- Cross-folder imports: `@/*` only (see `.cursor/rules/07-imports-lint.mdc`)
- Module mới: import `@/components/views`; form `RhfDataField`; không hybrid filter; không Generic* mới dưới ngưỡng 3-module

## Cursor rules

| File | Topic |
|------|--------|
| `.cursor/rules/01-core-stack.mdc` | React, TS, Next, Tailwind |
| `.cursor/rules/02-state-data.mdc` | TanStack Query + Zustand |
| `.cursor/rules/03-forms-validation.mdc` | RHF + Zod |
| `.cursor/rules/05-architecture.mdc` | Feature layout |
| `.cursor/rules/06-project-5f.mdc` | Dialog, drawer, toolbar |
| `.cursor/rules/07-imports-lint.mdc` | `@/` imports, `lint:ci` |
| `.cursor/rules/08-permissions.mdc` | RBAC matrix |

## Verification

`npx tsc --noEmit` sau mỗi cụm sửa · test liên quan khi xong một nghiệp vụ ·
`npm run lint:ci` + full `npm run test` + `npm run build` **chỉ khi được yêu cầu**
(build ~40-60s, `lint:ci` đã có `.husky/pre-commit` → `lint-staged` lo phần file
staged). Chi tiết ba tầng: `CLAUDE.md`.

Do not commit secrets (`.env`).
