# Thống kê tài liệu

Trang Pattern E (standalone) — clone chuẩn tab Thống kê Nhân viên.

## Route

`/hanh-chinh/thong-ke-tai-lieu`

## Permission

Cùng `documentList` (`hanh-chinh/danh-sach-tai-lieu` / DB `danh_sach_tai_lieu`).

## API

`GET /danh-sach-tai-lieu/stats/aggregates`

- ACL giống danh sách tài liệu
- Query: `from`, `to`, `id_loai_tai_lieu`, `trang_thai` (CSV)
- Lọc thời gian theo `tg_tao` (preset `all` = không lọc ngày)

## UI

- KPI: tổng, hiệu lực, dự thảo, chờ sửa, lỗi thời, số loại
- Charts: loại (donut), trạng thái (bar), xu hướng tháng (area), người tạo (bar ngang)
- `StatsDataGrid` theo loại + `StatsDrillDownDialog` → chi tiết tài liệu
- Export Excel/PDF khi có quyền `export`
