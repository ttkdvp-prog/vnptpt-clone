# Thiết lập khách hàng

Module Kinh doanh — Pattern A × 2 tab (master data).

## Route

`/kinh-doanh/thiet-lap-khach-hang?tab=nhom|trang-thai`

## Tabs

| Tab | Entity | Bảng |
|-----|--------|------|
| Nhóm khách hàng | `nhom-khach-hang` | `kh_thiet_lap_nhom_khach_hang` |
| Trạng thái khách hàng | `trang-thai-khach-hang` | `kh_thiet_lap_trang_thai` |

Cột: `id`, tên, `mo_ta`, `nguoi_tao`, `tg_tao`, `tg_cap_nhat`.

## Permission

- `AppResource`: `customerSettings`
- Module id: `kinh-doanh/thiet-lap-khach-hang`
- DB key: `thiet_lap_khach_hang`

## SQL

- Prisma migration: `prisma/migrations/20260717000000_thiet_lap_khach_hang/`
- Manual/emergency: `scripts/sql/create-kh-thiet-lap-khach-hang.sql`
