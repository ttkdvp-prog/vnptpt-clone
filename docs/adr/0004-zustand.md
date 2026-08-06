# 0004 — Zustand for UI / client state

## Status

Accepted

## Context

Cần state client cho filters, pagination, drawers, auth UI — tách khỏi server cache.

## Options

1. Redux / MobX.
2. React Context only.
3. Zustand.

## Decision

**Zustand** cho UI/client state (`store/`, `features/*/store/`). **Không** lưu server data trong Zustand.

## Consequences

- Nhẹ, ít boilerplate; `useShallow` khi select nhiều field.
- Auth/session “UI mirror” trong Zustand nhưng nguồn sự thật là Auth.js + API.
- Quy ước: Query = server; Zustand = UI.
