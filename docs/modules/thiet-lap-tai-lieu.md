# Thiết lập tài liệu

Module Hành chính — Pattern A × tab (master data).

## Route

`/hanh-chinh/thiet-lap-tai-lieu?tab=loai`

## Tabs

| Tab | Entity | Bảng |
|-----|--------|------|
| Loại tài liệu | `loai-tai-lieu` | `tai_lieu_thiet_lap_loai_tai_lieu` |

Cột: `id`, `thu_tu`, `ten_loai_tai_lieu`, `mo_ta`, `id_nguoi_tao` (Prisma/API: `nguoi_tao`), `tg_tao`, `tg_cap_nhat`.

## Permission

- `AppResource`: `documentSettings`
- Module id: `hanh-chinh/thiet-lap-tai-lieu`
- DB key: `thiet_lap_tai_lieu`

## SQL

- Prisma migration: `prisma/migrations/20260717030000_thiet_lap_tai_lieu/`
- Manual/emergency: `scripts/sql/create-tai-lieu-thiet-lap-loai-tai-lieu.sql`
