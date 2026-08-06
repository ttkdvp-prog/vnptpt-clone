# Phiếu hành chính

Route: `/hanh-chinh/phieu-hanh-chinh`  
Resource: `adminForms` → module `hanh-chinh/phieu-hanh-chinh` → DB key `phieu_hanh_chinh`

## Dữ liệu

Bảng: `cong_luong_phieu_hanh_chinh`

| Cột | Mô tả |
|-----|--------|
| `ma_phieu` | Mã loại phiếu hardcode (`XN` \| `NL` \| `CT` \| `NB` \| `DC`) — xem `features/hanh-chinh/phieu-hanh-chinh/core/loai-phieu.ts` |
| `id_nhan_vien` | FK → `var_nhan_vien` |
| `tu_ngay` / `den_ngay` | DATE |
| `buoi_bat_dau` / `buoi_ket_thuc` | `sang` \| `chieu` \| `dem` |
| `gio_bat_dau` / `gio_ket_thuc` | TEXT `HH:mm` (nullable) |
| `ly_do` | TEXT |
| `hinh_anh` | `TEXT[]` URL |
| `trang_thai` | `cho_ql_duyet` / `cho_hcns_duyet` / `da_duyet` / `tu_choi` |
| `id_ql_duyet`, `tg_ql_duyet`, `ghi_chu_ql` | Duyệt cấp QL |
| `id_hcns_duyet`, `tg_hcns_duyet`, `ghi_chu_hcns` | Duyệt cấp HCNS |
| `ly_do_tu_choi` | Khi từ chối |
| `id_nguoi_tao` | Prisma field `nguoi_tao` |

## Luồng duyệt

1. Tạo phiếu → `cho_ql_duyet`
2. QL duyệt → `cho_hcns_duyet` (`POST /phieu-hanh-chinh/:id/duyet-ql`)
3. HCNS duyệt → `da_duyet` (`POST /phieu-hanh-chinh/:id/duyet-hcns`)
4. Từ chối ở cấp QL hoặc HCNS → `tu_choi` (`POST /phieu-hanh-chinh/:id/tu-choi`)

Người dùng thường chỉ sửa/xóa khi còn `cho_ql_duyet`. Phiếu
`cho_hcns_duyet` hoặc `da_duyet` chỉ cho phép sửa/xóa khi người thao tác có
`cap_bac = 1` hoặc quyền quản trị module (`admin` / `all`).

## Filter

Loại phiếu, trạng thái, nhân viên, người tạo + search.

## Permission

Matrix module `hanh-chinh/phieu-hanh-chinh`. Own-row: xem/sửa theo `nguoi_tao`
nhưng không vượt qua khóa trạng thái chờ HCNS/đã duyệt. Duyệt cần quyền `sua`.

## SQL

- Prisma: `prisma/migrations/20260717060000_cong_luong_phieu_hanh_chinh/`
- Emergency: `scripts/sql/create-cong-luong-phieu-hanh-chinh.sql`
