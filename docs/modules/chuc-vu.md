# Module: Chức vụ (Phase 3.3)

Vertical slice after Phòng ban. Standard: [`module-standard.md`](../module-standard.md).

Hierarchy audit (Department → Position): [`chuc-vu-hierarchy-audit.md`](./chuc-vu-hierarchy-audit.md).

## Paths

| Layer | Path |
|-------|------|
| Feature UI | `features/he-thong/chuc-vu/` |
| Client service | `features/he-thong/chuc-vu/services/chuc-vu-service.ts` |
| API client | `lib/api/he-thong.ts` (`apiGetPositionsPage`, `apiUpdatePositionStatus`, …) |
| Hono routes | `server/routes/chuc-vu.ts` |
| Repository | `server/repositories/chuc-vu.ts` |
| Server RBAC | `server/permissions/chuc-vu.ts` |
| Prisma | `prisma/schema.prisma` → `var_chuc_vu` |
| SQL alter | `scripts/sql/alter-var-chuc-vu-phase33.sql` |

## Field map (DB ↔ app)

| DB (`var_chuc_vu`) | App (`Position`) |
|--------------------|------------------|
| `id` | `id` (string) |
| `ma_chuc_vu` | `ma_chuc_vu` |
| `ten_chuc_vu` | `ten_chuc_vu` |
| `id_phong_ban` | `phong_ban_id` |
| `cap_bac` | `cap_bac` |
| `mo_ta` | `mo_ta` |
| `thu_tu` | `thu_tu` |
| `trang_thai` (active/inactive) | `trang_thai` (Đang/Ngừng hoạt động) |
| `nguoi_tao` | `nguoi_tao` |
| `tg_tao` / `tg_cap_nhat` | ISO strings |

## API (api mode)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/chuc-vu?limit&offset&orderBy&ascending&search&activeOnly` | `xem` |
| GET | `/chuc-vu/:id` | `xem` (own row OK) |
| POST | `/chuc-vu` | `them` |
| PATCH | `/chuc-vu/:id` | `sua` (creator OK) |
| PATCH | `/chuc-vu/status/bulk` | `sua` — body `{ ids, trang_thai }` |
| DELETE | `/chuc-vu/:id` | `xoa` |

Super: `cap_bac === 1`. Module key DB: `chuc_vu`.

Invalidate `permissionGrants` on client when chức vụ changes (existing hooks).

## Checklist (Phase 3.3)

- [x] Prisma (`mo_ta`, `thu_tu`, `trang_thai`, audit)
- [x] SQL alter script
- [x] Repository + page API + active filter
- [x] Status toggle persists in api mode
- [x] Zod + server RBAC + tests
- [x] UI frozen
- [x] This documentation

Schema: dùng Prisma Migrate (`npm run db:migrate:deploy` / Docker entrypoint).  
SQL tay `scripts/sql/alter-var-chuc-vu-phase33.sql` là **legacy** — đã gộp vào baseline `prisma/migrations/`.
