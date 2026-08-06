# 0001 — Next.js App Router

## Status

Accepted

## Context

Ứng dụng ERP gốc là SPA React + Vite. Cần migration sang stack hỗ trợ SSR/RSC, Route Handlers, deploy Docker standalone, và một codebase cho UI + API.

## Options

1. Giữ Vite SPA + API server tách (Express/Hono riêng).
2. Next.js Pages Router.
3. Next.js 16 App Router (in-place migration).

## Decision

Dùng **Next.js 16 App Router**: `app/` cho routes, `views/` cho screen components, `features/` cho domain.

## Consequences

- Một process phục vụ UI + API; `output: 'standalone'` cho Docker.
- Cần `'use client'` boundary rõ; không còn Vite `import.meta.env` (dùng `NEXT_PUBLIC_*`).
- Middleware/proxy (`proxy.ts`) thay cho client-only route guards một phần.
