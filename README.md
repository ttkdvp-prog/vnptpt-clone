# An Hưng Thịnh ERP

Modern Enterprise Resource Planning (ERP) web application for internal operations — built with **Next.js 16**, **PostgreSQL**, **Prisma**, and **Auth.js**.

UI ngôn ngữ: **tiếng Việt**. Dark mode hỗ trợ sẵn.

---

## Features

| Module | Trạng thái | Mô tả |
|--------|------------|--------|
| **Hệ thống** | ✅ Đang dùng | Nhân viên, phòng ban, chức vụ, công ty, phân quyền |
| **Hồ sơ** | ✅ Đang dùng | Hồ sơ cá nhân / xem trước hồ sơ nhân viên |
| **Thông báo** | ✅ Đang dùng | Trung tâm thông báo |
| CRM | ⏳ Roadmap | Quản lý khách hàng & pipeline |
| Kho / Inventory | ⏳ Roadmap | Tồn kho, xuất nhập |
| Mua hàng | ⏳ Roadmap | Đề nghị / đơn mua |
| Bán hàng | ⏳ Roadmap | Đơn hàng, hóa đơn |
| Tài liệu | ⏳ Roadmap | Quản lý văn bản |
| Dashboard & Báo cáo | ⏳ Mở rộng | Thống kê theo module + báo cáo tổng hợp |

Chi tiết lộ trình: [`docs/roadmap.md`](docs/roadmap.md).

---

## Tech Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- UI primitives kiểu shadcn (`components/ui/`)
- Zustand (client/UI state)
- TanStack Query v5 (server state)
- React Hook Form + Zod
- Framer Motion · Recharts · Lucide · Sonner

### Backend

- Next.js Route Handlers (Hono app nhúng)
- Prisma ORM
- PostgreSQL 16
- Auth.js (Credentials) + bcrypt

### Infrastructure

- Docker · Docker Compose
- Nginx / Caddy (reverse proxy trên VPS)
- Sentry (optional)

---

## Quick start

### Requirements

| Công cụ | Phiên bản |
|---------|-----------|
| Node.js | **22.x** (LTS) |
| npm | đi kèm Node (project dùng `package-lock.json`) |
| Docker | khuyến nghị (Postgres local / deploy) |
| PostgreSQL | 16+ (hoặc container Compose) |

### Installation

```bash
git clone https://github.com/ttkdvp-prog/vnptpt-clone.git
cd vnptpt-clone
cp .env.example .env
# chỉnh DATABASE_URL, AUTH_SECRET, JWT_SECRET, NEXT_PUBLIC_DATA_SOURCE
npm install
npx prisma generate
```

### Database

```bash
# Postgres qua Docker (port host mặc định 5433)
docker compose up postgres -d

# Apply Prisma migrations (chuẩn)
npm run db:migrate:deploy
# Khi đổi schema trong dev: npm run db:migrate:dev
```

Chi tiết: [`docs/database.md`](docs/database.md).

### Development

```bash
npm run dev
# → http://localhost:3000
```

Mock offline (không cần Postgres):

```bash
# trong .env
NEXT_PUBLIC_DATA_SOURCE=mock
```

### Build & production

```bash
npm run build
npm run start
```

### Docker (app + Postgres)

```bash
docker compose up --build -d
```

Chi tiết deploy: [`docs/deployment.md`](docs/deployment.md) · [`docs/deploy-vps.md`](docs/deploy-vps.md).

---

## Environment

Copy từ [`.env.example`](.env.example). **Không commit** file `.env`.

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `DATABASE_URL` | ✅ (mode `api`) | Connection string Postgres. Ký tự đặc biệt trong password phải URL-encode (`@` → `%40`). |
| `AUTH_SECRET` | ✅ | Secret Auth.js (chuỗi dài, ngẫu nhiên). |
| `JWT_SECRET` | ✅ | Secret JWT phía server/Hono. |
| `NEXT_PUBLIC_DATA_SOURCE` | ✅ | `api` (Postgres) hoặc `mock` (offline). |
| `NEXT_PUBLIC_API_BASE_URL` | | Để trống = same-origin (Route Handlers). |
| `NEXT_PUBLIC_USE_PERMISSION_MATRIX` | | `true` khi đã có dữ liệu `var_phan_quyen`. |
| `NEXT_PUBLIC_MEDIA_PROVIDER` | | `local` (dev base64), `uploads` (VPS disk), hoặc `cloudinary`. |
| `NEXT_PUBLIC_APP_URL` | | Public origin, e.g. `https://anhungthinh.5fedu.com` — absolute `/uploads` URLs. |
| `UPLOAD_DIR` | | Server-only; filesystem root when provider=`uploads` (default `/data/uploads`). |
| `UPLOAD_REMOTE_BASE_URL` | | Dev only: proxy local `POST /uploads` to this VPS origin. |
| `UPLOAD_API_KEY` | | Shared secret (`X-Upload-Key`) for local→VPS upload proxy. |
| `CLIENT_ORIGINS` | | Optional comma-separated CORS origins. |
| `NEXT_PUBLIC_CLOUDINARY_*` | | Cloud name + unsigned upload preset. |
| `API_PORT` / `API_ORIGIN` | | Khi chạy Hono standalone (`npm run dev:server`). |
| `CLIENT_ORIGIN` | | Origin frontend (CORS khi tách API). |
| `AUTH_TRUST_HOST` | prod | `true` sau reverse proxy HTTPS. |
| `NEXT_PUBLIC_SENTRY_DSN` | | Optional monitoring. |

Giải thích đầy đủ: [`.env.example`](.env.example) và [`docs/authentication.md`](docs/authentication.md).

---

## Project structure (overview)

Repo **không dùng** thư mục `src/` — alias `@/*` trỏ thẳng root.

```
.
├── app/                 # Next.js App Router + API Route Handlers
├── views/               # Màn hình gắn route (Login, Home, …)
├── features/            # Module nghiệp vụ (he-thong/…)
├── components/          # ui, layout, shared, views primitives
├── server/              # Hono + Prisma (auth, routes, mappers)
├── prisma/              # schema PostgreSQL
├── lib/                 # query-keys, api client, permissions, utils
├── store/               # Zustand global (auth, …)
├── hooks/               # Hooks xuyên module
├── mocks/               # Dữ liệu mock
├── scripts/             # SQL / seed / tooling
├── docs/                # Tài liệu chi tiết
└── types/               # Type dùng chung
```

Mô tả từng thư mục: [`docs/folder-structure.md`](docs/folder-structure.md).

---

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Next.js dev — port **3000** |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Production server |
| `npm run preview` | `next start` port 3000 |
| `npm test` | Vitest (một lần) |
| `npm run test:watch` | Vitest watch |
| `npm run lint` | ESLint |
| `npm run lint:ci` | ESLint `--max-warnings 0` (gate CI) |
| `npm run lint:fix` | ESLint `--fix` |
| `npm run format` | Prettier write |
| `npm run db:generate` | Prisma generate |
| `npm run db:migrate` / `db:migrate:dev` | Prisma migrate dev |
| `npm run db:migrate:deploy` | Prisma migrate deploy (prod) |
| `npm run db:migrate:status` | Prisma migrate status |
| `npm run db:push` | Escape hatch only (không dùng làm workflow chính) |
| `npm run db:pull` | Prisma db pull |
| `npm run dev:server` | Hono standalone (port `API_PORT`) |
| `npm run dev:full` | API + web song song |

Trước khi merge: `npm run lint:ci` · `npm run test` · `npm run build`.

---

## Architecture (tóm tắt)

```
UI (views / feature components)
        ↓
TanStack Query hooks + Zustand (UI state)
        ↓
Feature service (mock | api)
        ↓
HTTP → Next Route Handlers / Hono
        ↓
server/repositories → Prisma → PostgreSQL
```

Phân quyền: ma trận theo chức vụ (`var_phan_quyen`) + `cap_bac` — **không** dùng `User.role`.

Chi tiết: [`docs/architecture.md`](docs/architecture.md) · [`docs/api.md`](docs/api.md) · [`docs/patterns-permissions.md`](docs/patterns-permissions.md).

---

## Documentation

| Tài liệu | Nội dung |
|----------|----------|
| [`docs/architecture.md`](docs/architecture.md) | Kiến trúc tổng thể, luồng dữ liệu |
| [`docs/folder-structure.md`](docs/folder-structure.md) | Cấu trúc thư mục & convention module |
| [`docs/coding-convention.md`](docs/coding-convention.md) | Naming, imports, lint |
| [`docs/database.md`](docs/database.md) | Prisma, schema, seed/SQL |
| [`docs/authentication.md`](docs/authentication.md) | Auth.js, session, login nhân viên |
| [`docs/api.md`](docs/api.md) | Route Handlers / Hono API |
| [`docs/deployment.md`](docs/deployment.md) | Docker, VPS, reverse proxy |
| [`docs/roadmap.md`](docs/roadmap.md) | Lộ trình phát triển |
| [`docs/changelog.md`](docs/changelog.md) | Lịch sử thay đổi lớn |
| [`docs/ui-guideline.md`](docs/ui-guideline.md) | Mục lục UI → UI-CONVENTIONS |
| [`docs/UI-CONVENTIONS.md`](docs/UI-CONVENTIONS.md) | Dialog, drawer, toolbar, stats… |
| [`docs/checklist-module.md`](docs/checklist-module.md) | Checklist CRUD module mới |
| [`docs/patterns-permissions.md`](docs/patterns-permissions.md) | RBAC ma trận |
| [`AGENTS.md`](AGENTS.md) | Hướng dẫn cho AI / agent |

---

## Coding convention (tóm tắt)

- **Files:** `kebab-case` (`nhan-vien-form.tsx`)
- **Components:** `PascalCase` (`NhanVienForm`)
- **Hooks / vars:** `camelCase` (`useEmployees`, `isLoading`)
- **Imports cross-folder:** chỉ `@/*` — không `../../`
- **UI copy:** tiếng Việt qua `txt()` khi thêm chuỗi mới

Chi tiết: [`docs/coding-convention.md`](docs/coding-convention.md).

---

## Git workflow

| Branch | Mục đích |
|--------|----------|
| `main` | Production-ready |
| `develop` | Tích hợp (nếu team dùng) |
| `feature/*` | Tính năng mới |
| `fix/*` | Bugfix |
| `chore/*` | Tooling / docs |

PR nhỏ, focused; chạy `lint:ci` + `test` + `build` trước khi merge.

---

## Deployment

```
GitHub → Docker build → Reverse proxy (Nginx/Caddy) → VPS
```

Xem [`docs/deployment.md`](docs/deployment.md).

---

## License

**Proprietary** — nội bộ An Hưng Thịnh. Không phân phối / tái sử dụng ngoài tổ chức trừ khi có thỏa thuận riêng.

`package.json` đánh dấu `"private": true`.

---

## Contributors

Nhóm phát triển nội bộ **An Hưng Thịnh**.

Liên hệ / onboarding kỹ thuật: xem tài liệu trong `docs/` và `AGENTS.md`.
