# 0005 — TanStack Query for server data

## Status

Accepted

## Context

List/detail/mutation cần cache, invalidate, staleTime thống nhất; tránh fetch ad-hoc trong component.

## Options

1. useEffect + fetch thủ công.
2. SWR.
3. TanStack Query v5.

## Decision

**TanStack Query v5**: keys trong `lib/query-keys.ts`, options trong `lib/query/query-config.ts`, hooks trong `features/*/hooks/`.

## Consequences

- Invalidate theo prefix key; `queryOptions` factories khi reuse ≥2 nơi.
- Mock/api service cùng interface — hooks không branch data source.
- Devtools chỉ môi trường dev.
