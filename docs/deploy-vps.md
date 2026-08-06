# Deploy An Hung Thinh ERP on VPS (Next.js + Postgres)

## Stack

- Next.js 16 (standalone) + Prisma + Auth.js
- PostgreSQL 16 via Docker Compose
- Chromium (headless) cho PDF tài liệu A4 — xem bên dưới

## Chromium cho export PDF

Hồ sơ nhân sự (`/nhan-vien/:id/ho-so.pdf`) render bằng Chromium ở server
(`lib/pdf/render-html-to-pdf.ts`). `Dockerfile` đã cài sẵn ở stage `runner`:

```
chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto
```

- **`font-noto` là bắt buộc** — thiếu nó tiếng Việt có dấu render thành ô vuông trong PDF.
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` + `PUPPETEER_SKIP_DOWNLOAD=1`
  (dùng Chromium hệ thống, không tải bản Chrome riêng của puppeteer → image nhỏ hơn).
- Container chạy user không phải root nên launch dùng `--no-sandbox --disable-dev-shm-usage`.
- **Tài nguyên:** image tăng ~250–400MB; mỗi lần render chiếm đỉnh ~300–500MB RAM.
  VPS nên còn **≥1GB trống**. Renderer giới hạn 2 lần render đồng thời và tự đóng
  browser sau 60s idle.
- Kiểm tra sau khi deploy: gọi `/nhan-vien/1/ho-so.pdf`, mở file và xác nhận
  tiếng Việt có dấu hiển thị đúng (không phải ô vuông).

## Quick start

1. Copy `.env.example` → `.env` and set:
   - `AUTH_SECRET` (long random)
   - `POSTGRES_PASSWORD`
   - `DATABASE_URL` (for local next outside compose) or rely on compose service env
2. Schema: image chạy `prisma migrate deploy` khi start (entrypoint via `scripts/prisma-migrate-deploy.mjs`). DB trống nhận migration tự động. DB cũ / bảng đã tạo tay: script tự baseline **P3005** và recover **P3009/P3018 + already exists** (xem [`database.md`](./database.md)). **Không** chạy `scripts/sql/*.sql` trên prod trước redeploy — dễ fail migrate → container không start → **502**.
3. Build & run:

```bash
docker compose up --build -d
```

4. Reverse proxy (Caddy example):

```
your.domain.com {
  reverse_proxy localhost:3000
}
```

Set `AUTH_TRUST_HOST=true` and use HTTPS so Auth.js cookies are Secure.

## Dokploy (Dockerfile)

App dùng Next.js `output: "standalone"`. Trên Dokploy:

1. **Build Type / Build Pack** = **Dockerfile** (không dùng Nixpacks nếu có thể).
2. Dockerfile path = `Dockerfile` (root repo).
3. **Port** = `3000`.
4. **Không** set Custom Start Command kiểu `npm start` / `next start` — để ENTRYPOINT `docker-entrypoint.sh` chạy (`prisma migrate` + `node server.js`).
5. Nếu bắt buộc Custom Command: dùng `npm start` (đã trỏ sang standalone), **không** dùng `next start`.
6. Domain + HTTPS (Let's Encrypt) như panel; đảm bảo DNS A trỏ đúng IP VPS.
7. Env runtime: `DATABASE_URL` (host DB nội bộ), `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `NEXT_PUBLIC_APP_URL=https://…`, `UPLOAD_DIR=/data/uploads`, `UPLOAD_API_KEY=…`. `NEXT_PUBLIC_*` nên set cả lúc **build** nếu Dokploy hỗ trợ build args.
8. Volume: mount `/data/uploads` để giữ file upload.

## Self-hosted media uploads (VPS disk)

Production can store logo/avatar on disk instead of Cloudinary:

1. Mount a persistent volume at **`/data/uploads`** inside the app container (Coolify: Volume Name + Mount Path `/data/uploads`).
2. Env (set **before build** so `NEXT_PUBLIC_*` is inlined into the client bundle):
   - `NEXT_PUBLIC_MEDIA_PROVIDER=uploads`
   - `NEXT_PUBLIC_APP_URL=https://anhungthinh.5fedu.com` (absolute image URLs)
   - `UPLOAD_DIR=/data/uploads` (runtime)
   - `UPLOAD_API_KEY=<long-secret>` (same value as local `.env` — allows local Next to proxy uploads)
   - Optional CORS: `CLIENT_ORIGINS=https://anhungthinh.5fedu.com,http://localhost:3000`
3. Redeploy. Upload API: `POST /uploads` (auth session **or** `X-Upload-Key`). Public files: `GET /uploads/...`.
4. Container runs as uid **1001** (`nextjs`). If upload fails with permission denied, fix volume ownership: `chown -R 1001:1001` on the host path / Coolify volume.

### Dev local → luôn lưu trên VPS

Local `.env` (không đưa `UPLOAD_API_KEY` lên git):

```env
NEXT_PUBLIC_MEDIA_PROVIDER=uploads
NEXT_PUBLIC_APP_URL=https://anhungthinh.5fedu.com
UPLOAD_REMOTE_BASE_URL=https://anhungthinh.5fedu.com
UPLOAD_API_KEY=<same-secret-as-vps>
```

Browser vẫn `POST /uploads` same-origin (đã login local). Next server **proxy** file lên VPS kèm `X-Upload-Key`. URL trả về luôn `https://anhungthinh.5fedu.com/uploads/...`.

Trên VPS: **không** set `UPLOAD_REMOTE_BASE_URL` (chỉ nhận và ghi `/data/uploads`).

Docker Compose already mounts named volume `anhungthinh_uploads` → `/data/uploads`.

## Dev without Docker app

```bash
docker compose up postgres -d
npm run db:migrate:deploy   # hoặc db:migrate:dev khi đổi schema
npm run dev
```

`npm run dev` starts Next on port 3000 (Hono API is embedded in Next Route Handlers).

## PWA

Installable web app: dynamic `app/manifest.ts` + `/api/pwa-icon/{192|512}` from Thông tin công ty (`ten_ung_dung`, `logo`). Service worker / offline (Serwist) is not enabled yet — `PwaRegister` still clears leftover Vite SW caches.
