# Danh sách market in

Module Sản xuất — Pattern A phẳng (`createFlatListFeatureModule`).

## Route

`/san-xuat/danh-sach-market-in`

## Dữ liệu

Bảng `sx_market_in`:

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | serial | PK |
| `thu_tu` | int | mặc định 0 |
| `id_khach_hang` | int | NOT NULL FK → `kh_danh_sach_khach_hang.id` |
| `ma_san_pham` | text | text tự nhập (chưa FK sản phẩm) |
| `ma_market` | text | UNIQUE — form gợi ý mã tăng dần `MI0001` (`GET /market-in/next-ma`) |
| `mo_ta` | text? | |
| `link_file` | text? | URL nhập tay |
| `id_nguoi_ve` | int? | id `var_nhan_vien` (không FK Prisma) |
| `trang_thai` | text | `cho_duyet` / `da_duyet` / `ngung_ap_dung` |
| `ngay_hieu_luc` | date? | |
| `id_nguoi_duyet` | int? | ghi khi duyệt |
| `tg_duyet` | timestamptz? | ghi khi duyệt |
| `nguoi_tao`, `tg_tao`, `tg_cap_nhat` | | hệ thống |

API enrich: `ten_khach_hang`, `ma_khach_hang` + `ten_nguoi_tao` / `ten_nguoi_ve` / `ten_nguoi_duyet` (`attachEmployeeNamesByFields`).

## Luồng duyệt

- Tạo mới → `cho_duyet`
- Nút **Duyệt** (`POST /market-in/:id/duyet`, quyền `sua`) → `da_duyet` + ghi `id_nguoi_duyet` / `tg_duyet` từ session
- Nút **Ngừng áp dụng** (`POST /market-in/:id/ngung`) → `ngung_ap_dung`

## Filter (Pattern A)

Search + chips **Khách hàng**, **Trạng thái**, **Người vẽ**, **Người tạo** (`FilterChipMultiSelect` + `filterGroups` mobile), `showBack` → `/san-xuat`.

## Permission

- `AppResource`: `printMarkets`
- Module id: `san-xuat/danh-sach-market-in`
- DB key: `danh_sach_market_in`

## Import/export

Cột: thứ tự, mã market, mã SP, mã KH, mô tả, link, người vẽ (tên), ngày hiệu lực — import lookup KH theo `ma_khach_hang`, người vẽ theo `ho_ten`.

## SQL

- Prisma migration: `prisma/migrations/20260717030000_sx_market_in/`
- Manual/emergency + seed: `scripts/sql/create-sx-market-in.sql`

Sau deploy: `npm run db:migrate:deploy` + restart `npm run dev` để nạp Prisma client mới.
