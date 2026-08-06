# Danh sách tài liệu

Module Hành chính — Pattern A flat list.

## Route

`/hanh-chinh/danh-sach-tai-lieu`

## Bảng

`tai_lieu_danh_sach_tai_lieu`

| Cột | Ghi chú |
|-----|---------|
| `id_loai_tai_lieu` | FK → `tai_lieu_thiet_lap_loai_tai_lieu` |
| `ten_tai_lieu`, `mo_ta`, `link_tai_lieu`, `ghi_chu` | |
| `trang_thai` | `du_thao` \| `hieu_luc` \| `loi_thoi` \| `cho_sua` |
| `id_chuc_vu`, `id_nhan_vien` | `INTEGER[]` ACL |
| `id_nguoi_tao` | Prisma/API: `nguoi_tao` |

## Permission

- `AppResource`: `documentList`
- Module id: `hanh-chinh/danh-sach-tai-lieu`
- DB key: `danh_sach_tai_lieu`

## ACL list

User thấy bản ghi nếu admin/super, là người tạo, cả hai mảng rỗng, hoặc khớp chức vụ / nhân viên trong mảng.

## SQL

- Migration: `prisma/migrations/20260717040000_danh_sach_tai_lieu/`
- Manual: `scripts/sql/create-tai-lieu-danh-sach-tai-lieu.sql`
