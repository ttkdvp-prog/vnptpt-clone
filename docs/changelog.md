# Changelog

Nhật ký thay đổi lớn (kiến trúc / nền tảng). Chi tiết commit xem `git log`.

Format gợi ý: [Keep a Changelog](https://keepachangelog.com/) — mục Added / Changed / Removed.

---

## Unreleased

### Added

- Bộ tài liệu onboarding: README mục lục + `docs/architecture.md`, `folder-structure.md`, `coding-convention.md`, `database.md`, `authentication.md`, `api.md`, `deployment.md`, `roadmap.md`, `ui-guideline.md`.

### Changed

- README chuyển sang vai trò index (~onboarding), chi tiết đẩy vào `docs/`.
- Env docs/rules: `NEXT_PUBLIC_*` (bỏ tham chiếu `VITE_*` còn sót).
- Database workflow: Prisma Migrate (`migrate dev` / `migrate deploy`) thay `db push` + SQL tay.
- Data boundary: auth/permissions gọi `server/repositories` — không Prisma trực tiếp ngoài repository.

### Removed

- `vercel.json` (SPA rewrite Vite/Vercel — không dùng với Next + VPS).
- Stub `App.tsx` và re-export tạm `components/providers/`.

### Added

- Baseline migration `prisma/migrations/20260716000000_init`.
- Docker entrypoint `scripts/docker-entrypoint.sh` (`prisma migrate deploy`).

---

## 2026-07 — Migration Next.js + Prisma

### Added

- Next.js 16 App Router (`app/`), views screen (`views/`).
- PostgreSQL + Prisma (`prisma/schema.prisma`).
- Auth.js Credentials (`auth.ts`).
- Hono API nhúng Route Handlers (`server/`).
- Docker / Docker Compose production image (standalone).
- Deploy notes: `docs/deploy-vps.md`.

### Changed

- Data access: feature services `mock` | `api` (HTTP) thay Supabase client trực tiếp.
- Query config chuyển `lib/query/query-config.ts`.
- Env: `NEXT_PUBLIC_*` thay `VITE_*`.

### Removed

- Vite entry (`index.html`, `vite.config.ts`).
- Supabase client, migrations folder, Edge Functions employee-auth.
- Tài liệu Supabase egress/setup.

---

## Trước đó — SPA Vite + Supabase

- React 19 admin SPA, module Hệ thống (nhân viên, phòng ban, chức vụ, phân quyền).
- TanStack Query + Zustand + RHF/Zod.
- UI conventions 5F (`docs/UI-CONVENTIONS.md`).
