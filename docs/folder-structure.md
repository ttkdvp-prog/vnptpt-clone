# Folder structure

Repo **không có** `src/`. Path alias `@/*` map tới root project (`tsconfig.json`).

## Phase 2 — Canonical map (ideal ↔ thực tế)

Không tạo `shared/` hay `styles/` ở root (trùng `components/shared` / `app/globals.css`).

| Ideal name (Phase 2) | Path thực tế (giữ / dùng) |
|----------------------|---------------------------|
| Shared UI primitives | `components/ui/` |
| Shared ERP patterns | `components/shared/` + barrel `@/components/views` |
| App shell chrome | `components/layout/` |
| Auth guards | `components/auth/` |
| Providers | `providers/` |
| Config (barrel) | `config/` → re-export `lib/env`, `lib/data/config`, nav |
| Styles / design tokens | `app/globals.css` + `lib/theme/` + `lib/dialog-sizes.ts` |
| Business modules | `features/<domain>/<entity>/` |
| Module scaffold | `features/_template/` |
| Screens | `views/` + `app/*/page.tsx` |
| Server / API | `server/` + `app/**/route.ts` |
| Types | `types/` |

Xem thêm: [design-system](./design-system.md) · [shared-ui-catalog](./shared-ui-catalog.md) · [business-foundation](./business-foundation.md) · [providers](./providers.md) · [navigation](./navigation.md).

## Cây thư mục chính

```
.
├── app/                    # Next.js App Router
│   ├── (app)/              # Dashboard layout (đã đăng nhập)
│   ├── (auth)/             # Auth layout (không sidebar)
│   ├── api/auth/           # Auth.js route
│   ├── nhan-vien/[[...path]]/  # Proxy Hono API
│   └── …
├── views/                  # Screen gắn route (Login, Home, Profile, …)
├── features/               # Domain modules
│   ├── _template/          # Scaffold cho module mới (Phase 3+)
│   └── he-thong/
│       ├── nhan-vien/
│       ├── phong-ban/
│       ├── chuc-vu/
│       ├── thong-tin-cong-ty/
│       ├── phan-quyen/
│       └── …
├── components/
│   ├── ui/                 # Primitives (Button, Input, …)
│   ├── shared/             # ConfirmDialog, GenericToolbar, …
│   ├── layout/             # Shell, nav, command palette
│   ├── views/              # Barrel CRUD foundations
│   ├── auth/               # ProtectedRoute, permission sync
│   └── providers/          # Re-export → @/providers (tương thích)
├── providers/              # AppProviders, AppShell
├── config/                 # Re-export env, data-source, nav
├── server/                 # Hono + Prisma
├── prisma/
├── lib/                    # Shared utilities
├── store/                  # Zustand global
├── hooks/                  # Cross-cutting hooks
├── mocks/
├── scripts/
├── types/
├── docs/
├── auth.ts
├── proxy.ts
└── package.json
```

## Mô tả ngắn

| Path | Mô tả |
|------|--------|
| `app/` | Routes Next: pages UI + Route Handlers gắn Hono |
| `app/(app)/` | Layout dashboard (sidebar) |
| `app/(auth)/` | Layout auth (không chrome app) |
| `views/` | Thành phần màn hình “page-level”, import từ `app/*/page.tsx` |
| `features/` | Nghiệp vụ theo domain/entity |
| `features/_template/` | Skeleton copy khi tạo module mới |
| `components/` | UI dùng chung, không thuộc một entity |
| `providers/` | Session, Query, Theme sync, Toast shell |
| `config/` | Điểm vào cấu hình (re-export, không duplicate logic) |
| `server/` | Backend nhúng: auth helpers, Prisma, Hono routes |
| `prisma/` | Schema Postgres |
| `lib/` | Hạ tầng app: keys, factories, validation |
| `store/` | State global (session UI, grants, …) |
| `hooks/` | Hooks dùng nhiều module |
| `mocks/` | Data khi `NEXT_PUBLIC_DATA_SOURCE=mock` |
| `docs/` | Onboarding & quy ước Phase 2+ |

## Convention trong một feature

```
features/<domain>/<entity>/
├── core/
│   ├── types.ts
│   ├── schema.ts          # Zod
│   ├── constants.ts
│   └── map-from-db.ts
├── components/
│   ├── <entity>-form.tsx
│   ├── <entity>-table.tsx
│   ├── <entity>-detail.tsx
│   └── <entity>-toolbar.tsx
├── hooks/
│   └── use-<entity>.ts
├── queries/
│   └── <entity>.ts        # queryOptions factories
├── store/
│   └── use<Entity>Store.ts
├── services/
│   └── <entity>-service.ts
└── utils/
```

Bắt đầu từ [`features/_template/`](../features/_template/README.md).

### Quy tắc

- Import **cross-folder**: `@/features/...`, `@/lib/...` — không `../../lib`.
- Trong cùng feature entity: relative `./` / `../` OK.
- Component render; logic ở hooks/services.
- Tham chiếu mẫu hoàn chỉnh: `features/he-thong/nhan-vien/`.

## Module mới

Checklist: [`checklist-module.md`](./checklist-module.md).  
Kiến trúc tổng: [`architecture.md`](./architecture.md).  
Foundation: [`business-foundation.md`](./business-foundation.md).
