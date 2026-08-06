# Module: Phòng ban (Phase 3.2)

Vertical slice after Nhân viên. Standard: [`module-standard.md`](../module-standard.md).

## Paths

| Layer | Path |
|-------|------|
| Feature UI | `features/he-thong/phong-ban/` |
| Client service | `features/he-thong/phong-ban/services/phong-ban-service.ts` |
| API client | `lib/api/he-thong.ts` (`apiGetDepartmentsPage`, …) |
| Hono routes | `server/routes/phong-ban.ts` |
| Repository | `server/repositories/phong-ban.ts` |
| Server RBAC | `server/permissions/phong-ban.ts` |
| Prisma | `prisma/schema.prisma` → `var_phong_ban` |
| SQL alter | `scripts/sql/alter-var-phong-ban-phase32.sql` |

## Field map (DB ↔ app)

| DB (`var_phong_ban`) | App (`Department`) |
|----------------------|--------------------|
| `id` | `id` (string) |
| `ma_phong_ban` | `ma_phong_ban` |
| `ten_phong_ban` | `ten_phong_ban` |
| `mo_ta` | `mo_ta` |
| `id_cha` | `cha_id` |
| `trang_thai` (active/inactive) | `trang_thai` (Đang/Ngừng hoạt động) |
| `thu_tu` | `thu_tu` |
| `nguoi_tao` | `nguoi_tao` |
| `tg_tao` / `tg_cap_nhat` | ISO strings |
| — | `cap_do` / `duong_dan` (computed in mapper) |

## API (api mode)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/phong-ban?limit&offset&orderBy&ascending&search` | `xem` |
| GET | `/phong-ban/:id` | `xem` (own row OK) |
| POST | `/phong-ban` | `them` |
| PATCH | `/phong-ban/:id` | `sua` (creator OK without `sua`) |
| DELETE | `/phong-ban/:id` | `xoa` (blocked if has children) |

Super: `cap_bac === 1`. Module key DB: `phong_ban`.

## mock vs api

| | mock | api |
|--|------|-----|
| Data | `MockRepository` + `MOCK_DEPARTMENTS` | Prisma |
| Pagination | client repo page | server enrich-all then page |
| Hierarchy | client `duong_dan`/`cap_do` | mapper `enrichDepartmentsHierarchy` |

## Checklist (Phase 3.2)

- [x] Prisma model (mo_ta, thu_tu, audit)
- [x] SQL alter script
- [x] Repository + page API
- [x] Zod on Hono create/update
- [x] Server RBAC + tests
- [x] Client page API (no fetch-all-then-slice)
- [x] UI frozen (toolbar/table/form/detail)
- [x] This documentation

Schema: dùng Prisma Migrate (`npm run db:migrate:deploy` / Docker entrypoint).  
SQL tay `scripts/sql/alter-var-phong-ban-phase32.sql` là **legacy** — đã gộp vào baseline `prisma/migrations/`.
