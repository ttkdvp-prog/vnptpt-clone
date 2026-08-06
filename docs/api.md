# API

API nghiệp vụ chạy trên **Hono**, mount qua **Next.js Route Handlers** (same-origin khi `NEXT_PUBLIC_API_BASE_URL` trống).

## Entry points

| Path | Vai trò |
|------|---------|
| `server/hono-app.ts` | Tạo Hono app, mount routes |
| `server/routes/*.ts` | Handler theo entity |
| `lib/api/hono-next-handler.ts` | Adapter Hono ↔ Next Request/Response |
| `app/<entity>/[[...path]]/route.ts` | Catch-all forward vào Hono |
| `app/auth/[[...path]]/route.ts` | Auth API nhúng |
| `app/health/route.ts` | Health check |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js |

Có thể chạy Hono standalone: `npm run dev:server` (port `API_PORT`, mặc định 3001) — chủ yếu debug; luồng chuẩn là nhúng trong Next.

## Routes hiện có (Hệ thống)

| Prefix (app) | Server route | Entity |
|--------------|--------------|--------|
| `/nhan-vien` | `server/routes/nhan-vien.ts` | Nhân viên |
| `/phong-ban` | `server/routes/phong-ban.ts` | Phòng ban |
| `/chuc-vu` | `server/routes/chuc-vu.ts` | Chức vụ |
| `/cong-ty` | `server/routes/cong-ty.ts` | Công ty |
| `/phan-quyen` | `server/routes/phan-quyen.ts` | Phân quyền |
| `/auth` | `server/routes/auth.ts` | Auth phụ trợ |

Client gọi qua `lib/api/client.ts` + `lib/api/he-thong.ts`. Feature service chọn `mock` | `api` theo env.

## Client call pattern

```
Component
  → useQuery / useMutation (hooks)
  → getEmployees() / createEmployee() (services)
  → apiFetch(...) (lib/api)
  → /nhan-vien/... (same origin)
  → Hono → Prisma
```

## Conventions

- Response JSON typed; map DB → domain ở `server/mappers.ts` / `map-from-db`.
- Lỗi: message rõ ràng; client dùng `getErrorMessage` + Sonner toast.
- Mọi mutation cần auth session; kiểm quyền module / `nguoi_tao` trên server.
- Không expose Prisma Client ra browser.

## Auth trên API

- Session Auth.js (cookie) trên request same-origin.
- Helpers trong `server/auth.ts`.
- Super / matrix / own-row: [`authentication.md`](./authentication.md), [`patterns-permissions.md`](./patterns-permissions.md).

## Thêm endpoint mới

1. Handler trong `server/routes/<entity>.ts`.
2. Mount trong `hono-app.ts`.
3. Catch-all `app/<entity>/[[...path]]/route.ts` (nếu entity mới).
4. Client helper trong `lib/api/`.
5. Feature `services/` + query keys + tests nếu có logic.

## Liên quan

- [`architecture.md`](./architecture.md)
- [`database.md`](./database.md)
- Health: `GET /health`
