# 0006 — Hono on Next Route Handlers

## Status

Accepted (Phase 3 — may revisit Server Actions later)

## Context

Cần REST contract ổn định cho client `lib/api/*` sau khi bỏ Supabase. Next hỗ trợ Route Handlers và Server Actions.

## Options

1. Server Actions thuần (form/mutation).
2. Next Route Handlers viết tay từng path.
3. Hono app nhúng, mount qua `app/<resource>/[[...path]]/route.ts`.

## Decision

**Hono** nhúng Next Route Handlers; client giữ `apiFetch` + cookie Auth.js session headers. Server Actions **không** thay REST trong Phase 3.

## Consequences

- Một chỗ định nghĩa routes (`server/routes/*`); dễ test.
- Thêm lớp `server/repositories/*` cho Prisma.
- Sau này có thể thêm Server Actions cho form-only flows mà không phá `lib/api` ngay.
