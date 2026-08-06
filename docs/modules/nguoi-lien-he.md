# Người liên hệ

Module Kinh doanh — bảng con của Danh sách khách hàng + trang list riêng.

## Route

`/kinh-doanh/nguoi-lien-he`

## Dữ liệu

Bảng `kh_nguoi_lien_he`:

| Cột | Ghi chú |
|-----|---------|
| `id_khach_hang` | NOT NULL FK → `kh_danh_sach_khach_hang` |
| `ho_ten` | bắt buộc |
| `ngay_sinh` | text nullable — `YYYY` hoặc `YYYY-MM-DD` |
| `chuc_vu` | free text |
| `so_dien_thoai`, `email`, `dia_chi`, `ghi_chu` | optional |
| `nguoi_tao`, `tg_tao`, `tg_cap_nhat` | hệ thống |

## UI

- Pattern A: `createFlatListFeatureModule` — filter Khách hàng + Người tạo
- Embed trong detail khách hàng: `EmbeddedChildDataGrid` (max 5 dòng), form prefills `defaultKhachHangId`

## Permission

- `AppResource`: `contacts`
- Module id: `kinh-doanh/nguoi-lien-he`
- DB key: `nguoi_lien_he`

## SQL

- Prisma: `prisma/migrations/20260717020000_nguoi_lien_he/`
- Manual: `scripts/sql/create-kh-nguoi-lien-he.sql`
