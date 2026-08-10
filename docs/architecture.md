# Architecture

Tài liệu kiến trúc Trung tâm hạ tầng. README chỉ tóm tắt — đây là nguồn chi tiết.

> **Lưu ý:** data layer đã chuyển từ PostgreSQL/Prisma sang Google Sheets API
> (`lib/sheets/`) và deploy target sang Vercel — xem [`AGENTS.md`](../AGENTS.md) và
> [`deploy-vercel.md`](./deploy-vercel.md). Các đoạn nhắc tới Prisma/Postgres/Docker
> dưới đây là lịch sử, chưa cập nhật hết.

## Mục tiêu

- ERP nội bộ, UI tiếng Việt, module hóa theo domain.
- Một codebase: Next.js App Router phục vụ UI + API (Hono nhúng Route Handlers).
- Tách rõ: **server state** (TanStack Query) vs **UI state** (Zustand).
- Phân quyền ma trận theo chức vụ — enforce cả client (UX) và server (bắt buộc).

## High-level

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                 │
│  views/ + features/*/components                          │
│  AuthSessionSynchronizer · PermissionMatrixSynchronizer  │
└─────────────┬───────────────────────────┬───────────────┘
              │ TanStack Query            │ Zustand (UI)
              ▼                           ▼
       feature services              store/ + features/*/store
       (mock | api)                         │
              │                             │
              ▼                             │
       lib/api/client  ─────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js (app/)                                          │
│  Route Handlers → Hono (server/hono-app.ts)              │
│  Auth.js (auth.ts) · Prisma (server/db.ts)               │
└─────────────┬───────────────────────────────────────────┘
              ▼
         PostgreSQL
```

## Lớp dữ liệu (module CRUD)

Ví dụ **Nhân viên**:

```
UI (nhan-vien-form / table / detail)
        ↓
hooks/ (useQuery · useMutation)
        ↓
services/nhan-vien-service.ts   ← mock | api theo NEXT_PUBLIC_DATA_SOURCE
        ↓
lib/api/he-thong.ts → HTTP
        ↓
server/routes/nhan-vien.ts (Hono)
        ↓
server/repositories/nhan-vien.ts
        ↓
Prisma (server/db.ts) → PostgreSQL
```

**Boundary bắt buộc:** feature UI / hooks **không** import Prisma hay `@/server/**`. Chỉ `server/repositories` (và infra như health) chạm DB.

Không dùng Server Actions làm lớp chính cho CRUD hiện tại — API đi qua **Route Handlers + Hono**.

## Feature modules

Mỗi entity nằm dưới `features/<domain>/<entity>/`:

| Thư mục | Vai trò |
|---------|---------|
| `core/` | types, Zod schema, constants, map-from-db |
| `components/` | form, table, toolbar, detail |
| `hooks/` | wrapper TanStack Query |
| `queries/` | `queryOptions()` dùng chung (≥2 chỗ) |
| `store/` | Zustand: filter, pagination, drawer — **không** chứa data API |
| `services/` | gọi API / mock — không phụ thuộc React |
| `utils/` | pure helpers |

Domain hiện tại: `features/he-thong/` (nhân viên, phòng ban, chức vụ, công ty, phân quyền, …).

## State

| Concern | Tool | Vị trí |
|---------|------|--------|
| Server / async | TanStack Query v5 | `features/*/hooks`, `lib/query-keys.ts` |
| UI (filter, sort, drawer) | Zustand | `features/*/store`, `store/` |
| Query options chung | — | `lib/query/query-config.ts` |

Quy tắc: **không** lưu kết quả API trong Zustand; invalidate theo prefix key đã đăng ký trong `lib/query-keys.ts`.

## Auth & permissions

1. Đăng nhập Credentials (Auth.js) → session nhân viên.
2. Hydrate Zustand qua `AuthSessionSynchronizer`.
3. Load ma trận quyền theo `chuc_vu_id` → `usePermissionGrantStore`.
4. Super: `cap_bac === 1` → full CRUD mọi module.
5. Server route phải kiểm quyền tương đương client.

Chi tiết: [`authentication.md`](./authentication.md), [`patterns-permissions.md`](./patterns-permissions.md).

## Routing

| Lớp | Vai trò |
|-----|---------|
| `app/` | App Router pages + catch-all API (`app/nhan-vien/[[...path]]`, …) |
| `app/(app)/` | Dashboard layout (sidebar) — `ProtectedRoute` + `Layout` |
| `app/(auth)/` | Auth layout (no chrome) — `/dang-nhap`, `/login`, … |
| `views/` | Screen components gắn vào `app/` pages |
| `lib/navigation` | Navigation helpers (thay React Router) |
| Nav config | [`navigation.md`](./navigation.md) |

Providers: [`providers.md`](./providers.md). Layout app đã đăng nhập: `app/(app)/` + `providers/`. Auth pages: `app/(auth)/`.

## Data source modes

| `NEXT_PUBLIC_DATA_SOURCE` | Hành vi |
|---------------------------|---------|
| `mock` | Service trả mock — không cần Postgres |
| `api` | Service gọi HTTP → Hono/Prisma |

Component/hook **không** branch theo mock; chỉ service.

## View / data type system

- **ViewTypeId** — layout màn hình: `lib/view-types/`, catalog `view-types.md`
- **DataTypeId** — widget field/cell: `lib/data-types/`, `data-types.md`
- Factory CRUD: `createFeatureModule` / `createFlatListFeatureModule` trong `lib/factories/`

## Liên quan

- [`folder-structure.md`](./folder-structure.md)
- [`api.md`](./api.md)
- [`database.md`](./database.md)
- [`UI-CONVENTIONS.md`](./UI-CONVENTIONS.md)
- Cursor rules: `.cursor/rules/05-architecture.mdc`, `02-state-data.mdc`
