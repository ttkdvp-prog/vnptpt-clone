# Deployment (lịch sử — đã chuyển sang Vercel)

> **Đã thay thế.** App deploy trên Vercel, không còn Docker/VPS. Xem
> [`deploy-vercel.md`](./deploy-vercel.md) cho quy trình hiện tại. Nội dung dưới đây
> giữ lại làm tham chiếu lịch sử.

Luồng cũ:

```
GitHub → Docker build → Reverse proxy (Nginx / Caddy) → VPS
```

## Stack production

- Next.js 16 **standalone** (`Dockerfile` multi-stage, Node 22 Alpine)
- PostgreSQL 16 (`docker-compose.yml` service `postgres`)
- Auth.js cookies Secure qua HTTPS
- Optional: Cloudinary cho media; Sentry cho lỗi

## Docker Compose

Services:

| Service | Port (host) | Mô tả |
|---------|-------------|--------|
| `postgres` | `5433` → 5432 | Postgres + volume `pgdata` |
| `app` | `3000` | Next standalone |

```bash
cp .env.example .env
# AUTH_SECRET, POSTGRES_PASSWORD, …

docker compose up --build -d
```

App entrypoint chạy `prisma migrate deploy` trước khi start Next. Chi tiết schema: [`database.md`](./database.md).

Biến quan trọng trên Compose:

- `DATABASE_URL` (trong service `app`): host `postgres`, port nội bộ `5432`
- `AUTH_SECRET`, `AUTH_TRUST_HOST=true`
- `NEXT_PUBLIC_DATA_SOURCE=api`

## Dev: chỉ Postgres trong Docker

```bash
docker compose up postgres -d
npm run db:migrate:deploy
npm run dev
```

## Reverse proxy

Ví dụ Caddy:

```
your.domain.com {
  reverse_proxy localhost:3000
}
```

Nginx: `proxy_pass` tới `127.0.0.1:3000`, header `Host`, `X-Forwarded-Proto`, `X-Forwarded-For`.

Sau proxy HTTPS:

```env
AUTH_TRUST_HOST=true
```

## Checklist trước go-live

1. Đổi password Postgres và mọi secret (`AUTH_SECRET`, `JWT_SECRET`).
2. Schema DB khớp `prisma/schema.prisma` (+ SQL bổ sung nếu cần).
3. `NEXT_PUBLIC_USE_PERMISSION_MATRIX=true` khi đã seed `var_phan_quyen`.
4. HTTPS bắt buộc cho cookie session.
5. Không commit `.env`; mount/secret trên VPS.
6. Kiểm `GET /health`.
7. Backup volume Postgres định kỳ.

## CI (khuyến nghị)

Trên PR:

```bash
npm ci
npm run lint:ci
npm run test
npm run build
```

## PWA

Manifest + icon động theo Thông tin công ty. Service worker / offline (Serwist) chưa bật — `PwaRegister` chỉ dọn SW Vite cũ.

## Liên quan

- [`database.md`](./database.md)
- [`authentication.md`](./authentication.md)
- [`Dockerfile`](../Dockerfile) · [`docker-compose.yml`](../docker-compose.yml)
