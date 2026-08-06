# Thông báo

Route: `/hanh-chinh/thong-bao`  
Resource: `announcements` → module `hanh-chinh/thong-bao` → DB key `thong_bao`  
API: `/hc-thong-bao` (tránh đụng page inbox `/thong-bao`)

Module CRUD Pattern A — thông báo nội bộ, phân quyền xem theo chức vụ (`Int[]`).

## Dữ liệu

Bảng: `hc_thong_bao`.

| Cột | Kiểu | Mô tả |
|-----|------|--------|
| `id` | INT PK | Tự tăng |
| `tg_dang` | TIMESTAMPTZ | Ngày giờ đăng |
| `tieu_de` | TEXT | Tiêu đề |
| `noi_dung` | TEXT | Nội dung |
| `id_chuc_vu` | INT[] | Rỗng = tất cả; có giá trị = chỉ các chức vụ được chọn |
| `id_nguoi_tao` | INT (nullable) | Prisma field `nguoi_tao` |
| `tg_tao` / `tg_cap_nhat` | TIMESTAMPTZ | Audit |

Migration: `prisma/migrations/20260718060000_hc_thong_bao/`.  
Seed: `prisma/migrations/20260718061000_seed_hc_thong_bao/` (3 bản mẫu; chỉ insert khi bảng trống).

## ACL xem

- Super / module admin: xem tất cả
- Còn lại: `id_chuc_vu` rỗng **hoặc** chứa chức vụ của viewer **hoặc** là người tạo

## Ngoài phạm vi (MVP)

- Đẩy chuông inbox `/thong-bao`
- Đính kèm, ghim, hết hạn, rich text
