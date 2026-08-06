# Coding convention

Quy ước code An Hưng Thịnh ERP. Gate trước merge: `npm run lint:ci` · `npm run test` · `npm run build`.

## Ngôn ngữ

| Ngữ cảnh | Quy ước |
|----------|---------|
| UI end-user | Tiếng Việt (`txt()` / `lib/text`) |
| Code, comment, commit | English hoặc Vietnamese — khớp file hiện có |
| Tên bảng/cột DB | Tiếng Việt snake_case (`ho_va_ten`, `ma_chuc_vu`) |

## Naming

| Loại | Style | Ví dụ |
|------|-------|--------|
| File / folder | `kebab-case` | `nhan-vien-form.tsx`, `use-nhan-vien.ts` |
| React component | `PascalCase` | `NhanVienForm` |
| Hook | `use` + Pascal/camel | `useEmployees`, `useCreateEmployee` |
| Hàm / biến | `camelCase` | `isLoading`, `canDelete` |
| Hằng số object | `UPPER_SNAKE` hoặc `as const` | `DIALOG_SIZE`, `queryKeys` |
| Type / interface | `PascalCase` | `Employee`, `NhanVienFormValues` |
| Zod schema | `camelCase` + `Schema` | `nhanVienFormSchema` |

Tránh `any` — dùng `unknown` + type guard. Prefer `interface` cho object shape; `type` cho union/intersection. Không dùng TypeScript `enum` — dùng `const` + `as const`.

## React

- Functional components only; không import mặc định `React` (JSX transform).
- Không class components, không CSS-in-JS.
- Logic nghiệp vụ → hooks/services; component tập trung render.
- Mục tiêu: ≤150 dòng/component, ≤30 dòng/hàm (tách khi vượt).
- Conditional class: `cn()` từ `@/lib/utils`.

## Imports

```ts
// ✅ cross-folder
import { queryKeys } from '@/lib/query-keys';

// ✅ trong cùng feature
import { nhanVienFormSchema } from '../core/schema';

// ❌ forbidden
import { queryKeys } from '../../lib/query-keys';
```

- ESLint `no-restricted-imports` → **error** với `../../*`.
- Kiểm: `npm run lint:imports:check` · sửa hàng loạt: `node scripts/fix-deep-imports.mjs`.
- Skill: `.cursor/skills/import-lint/SKILL.md`.

## State & data

- Server data: TanStack Query — keys trong `lib/query-keys.ts`.
- UI state: Zustand + `useShallow` khi select nhiều field.
- Invalidate prefix key (mảng), **không** truyền factory function vào `invalidateQueries`.
- Shared options: `listQueryOptions` / `masterDataQueryOptions` / `authSensitiveQueryOptions` từ `lib/query/query-config.ts`.

Xem `.cursor/rules/02-state-data.mdc`.

## Forms

- Schema Zod trong `features/*/core/schema.ts`.
- RHF + `zodResolver`.
- Field UI: `RhfDataField` / primitives từ `@/components/views`.
- `required` trên Input là display; validation vẫn từ Zod.

## Permissions (UI)

- Toolbar: `useResourcePermissions(resource)`.
- Row/detail: `useCanOnRecord(...)`.
- Không authorize bằng `User.role`.
- Chi tiết: [`patterns-permissions.md`](./patterns-permissions.md).

## UI / layout

- Dialog sizes: `lib/dialog-sizes.ts`.
- Drawer: `GenericDrawer` + `stackLevel`.
- Section titles: `variant="primary"` mặc định.
- Nguồn đầy đủ: [`ui-guideline.md`](./ui-guideline.md) → [`UI-CONVENTIONS.md`](./UI-CONVENTIONS.md).

## Phase 2 — folder / export / route / RSC

| Topic | Quy ước |
|-------|---------|
| Folder map | [`folder-structure.md`](./folder-structure.md) — không tạo `shared/` / `styles/` root trùng |
| Providers | `@/providers/*` |
| Config entry | `@/config` re-export; logic vẫn ở `lib/` |
| New module | Copy `features/_template/` · checklist + [`business-foundation.md`](./business-foundation.md) |
| Export barrel | CRUD UI: `@/components/views`; không barrel toàn app |
| Routes | `app/(app)/` dashboard · `app/(auth)/` auth · API catch-all ngoài group |
| Nav | Config only — [`navigation.md`](./navigation.md) |
| Error / loading | `ErrorBoundary` / Sonner · `PageFallback` / skeletons — không invent parallel stack |
| Server vs Client | Default Server Component trong `app/`; `'use client'` ở providers, layout shell, interactive features |

## Git / PR

- Branch: `feature/*`, `fix/*`, `chore/*` → PR vào `main` (hoặc `develop`).
- Diff tối thiểu — không refactor ngoài phạm vi task.
- Không commit `.env` / secrets.
- Pre-commit: Husky + lint-staged (ESLint fix trên staged `*.{ts,tsx}`).

## Banned (stack)

- Redux, MobX, Formik, Yup
- Thêm ORM/auth stack khác không có approval
- Default “AI purple gradient” aesthetics — theo 5F UI conventions
- Phase 2: không migrate module nghiệp vụ mới; không rename Generic* → ERP*
