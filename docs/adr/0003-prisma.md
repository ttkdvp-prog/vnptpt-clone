# 0003 — Prisma on PostgreSQL

## Status

Superseded — xem ADR mới cho migrate sang Google Sheets API (data layer) + Vercel (deploy target).
Giữ lại làm hồ sơ quyết định lịch sử.

## Context

Cần ORM type-safe trên Postgres VPS; đã loại bỏ Supabase PostgREST.

## Options

1. SQL thuần (`postgres` / `pg`).
2. Prisma.
3. Drizzle / Kysely.

## Decision

Dùng **Prisma** (`prisma/schema.prisma` + `@prisma/client`) với PostgreSQL 16.

**Schema workflow:** Prisma Migrate — nguồn sự thật là `prisma/migrations/`.

| Môi trường | Lệnh |
|------------|------|
| Development | `prisma migrate dev` (`npm run db:migrate:dev`) |
| Production / Docker | `prisma migrate deploy` (`npm run db:migrate:deploy`, entrypoint) |

`prisma db push` và SQL tay trong `scripts/sql/` chỉ còn escape hatch / legacy — không phải luồng chính.

## Consequences

- Type-safe queries; `prisma generate` trong build.
- Mọi thay đổi schema → migration mới, commit cùng PR.
- Repository server (`server/repositories/*`) gọi Prisma; không expose Prisma ra client (features / components / views / hooks).
- DB đã tồn tại từ `db push`: baseline `migrate resolve --applied` một lần (xem `docs/database.md`).
