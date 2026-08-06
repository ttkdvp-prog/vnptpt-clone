# Danh sách khách hàng

Module Kinh doanh — Pattern A phẳng (`createFlatListFeatureModule`).

## Route

`/kinh-doanh/khach-hang`

## Dữ liệu

Bảng `kh_danh_sach_khach_hang`:

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | serial | PK |
| `ma_khach_hang` | text | UNIQUE — form gợi ý mã tăng dần `KH0001` (endpoint `GET /khach-hang/next-ma`), user sửa được |
| `ten_khach_hang` | text | bắt buộc |
| `so_dien_thoai` | text? | validate SĐT VN |
| `dia_chi` | text? | |
| `ghi_chu` | text? | textarea auto-grow |
| `id_nhom` | int | NOT NULL FK → `kh_thiet_lap_nhom_khach_hang.id` |
| `id_trang_thai` | int | NOT NULL FK → `kh_thiet_lap_trang_thai.id` |
| `nguoi_tao`, `tg_tao`, `tg_cap_nhat` | | hệ thống |

API enrich: `ten_nhom`, `ten_trang_thai` (Prisma include) + `ten_nguoi_tao` (`attachCreatorNames`).

## Filter (Pattern A)

Search + chips **Nhóm KH**, **Trạng thái**, **Người tạo** (`FilterChipMultiSelect` + `filterGroups` mobile), `showBack` → `/kinh-doanh`.

## Permission

- `AppResource`: `customers`
- Module id: `kinh-doanh/khach-hang`
- DB key: `danh_sach_khach_hang`

## Import/export

Cột: mã, tên, SĐT, địa chỉ, ghi chú, `ten_nhom`, `ten_trang_thai` — import lookup theo tên nhóm/trạng thái.

## SQL

- Prisma migration: `prisma/migrations/20260717010000_danh_sach_khach_hang/`
- Manual/emergency + seed: `scripts/sql/create-kh-danh-sach-khach-hang.sql`

Sau deploy: `npm run db:migrate:deploy` + restart `npm run dev` để nạp Prisma client mới.
