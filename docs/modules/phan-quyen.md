# Module: Phân quyền (Phase 3.4)

Permission matrix — **UI frozen** (`permission-matrix.tsx`). Server harden only.

## Paths

| Layer | Path |
|-------|------|
| Feature UI | `features/he-thong/phan-quyen/` |
| Hono | `server/routes/phan-quyen.ts` |
| Repository | `server/repositories/phan-quyen.ts` |
| RBAC | `server/permissions/phan-quyen.ts` |
| Prisma | `var_phan_quyen` |
| SQL | `scripts/sql/create-var-cong-ty-phan-quyen.sql` |

## API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/phan-quyen?module_key=` (**required**) | `xem` \| `sua` \| admin \| super |
| PUT | `/phan-quyen` | `sua` \| admin \| super (not `them`/`xoa` alone) |

### Rules

- GET without `module_key` → 400 (no full-table dump).
- PUT validates `chuc_vu_id` exists; sanitizes `quyen` via `parseQuyenCsv` / `formatQuyenCsv`.
- Non-super cannot grant `admin` / `tat_ca` / `all` on module `phan_quyen`.
- Sets `tg_cap_nhat` on write.

Module key DB: `phan_quyen`.
