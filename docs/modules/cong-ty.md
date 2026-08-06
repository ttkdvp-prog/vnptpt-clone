# Module: Thông tin công ty (Phase 3.4)

Singleton form — **UI frozen** (`thong-tin-cong-ty-form.tsx`). Server harden only.

## Paths

| Layer | Path |
|-------|------|
| Feature UI | `features/he-thong/thong-tin-cong-ty/` |
| Hono | `server/routes/cong-ty.ts` |
| Repository | `server/repositories/cong-ty.ts` |
| RBAC | `server/permissions/cong-ty.ts` |
| Prisma | `var_cong_ty` |
| SQL | `scripts/sql/create-var-cong-ty-phan-quyen.sql` |

## API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/cong-ty` | `xem` \| `sua` \| admin \| super |
| PATCH | `/cong-ty` | `sua` \| admin \| super |

- GET does **not** create a row (returns empty defaults if missing).
- PATCH upserts id=1 and sets `tg_cap_nhat`.
- Zod mirrors form schema (appName ≥2, companyName ≥2, taxId ≥5, desc ≤30).

Module key DB: `thong_tin_cong_ty`.
