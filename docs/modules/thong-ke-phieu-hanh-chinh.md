# Thống kê phiếu hành chính

Trang Pattern E (standalone) — clone chuẩn Thống kê tài liệu / tab Thống kê Nhân viên.

## Route

`/hanh-chinh/thong-ke-phieu-hanh-chinh`

Nav: Hành chính → Công lương, ngay sau **Phiếu hành chính**.

## Permission

Cùng `adminForms` (`hanh-chinh/phieu-hanh-chinh` / DB `phieu_hanh_chinh`).

## API

`GET /phieu-hanh-chinh/stats/aggregates`

- Auth: quyền `xem` module phiếu hành chính
- Query (CSV): `ma_phieu`, `trang_thai`, `id_phong_ban`, `id_nhan_vien`, `from`, `to`
- Lọc thời gian theo **kỳ nghỉ** (overlap): `tu_ngay <= to AND den_ngay >= from`
- Preset `all` = không gửi `from`/`to`

List drill-down: `GET /phieu-hanh-chinh` với cùng filter params.

## Số ngày

Không lưu cột DB. Công thức ngày lịch (bỏ buổi):

`so_ngay = (den_ngay − tu_ngay) + 1`

Util: `features/hanh-chinh/phieu-hanh-chinh/utils/compute-so-ngay.ts`

KPI **Tổng ngày** và cột tổng ngày trong bảng chỉ cộng phiếu `da_duyet`.

## UI

- Filter: thời gian, loại phiếu, trạng thái, phòng ban, nhân viên
- KPI: tổng, đã duyệt, chờ duyệt, từ chối, tổng ngày (đã duyệt), số loại
- Charts: loại (donut), trạng thái (bar), xu hướng theo tháng `tu_ngay` (area), top phòng ban (bar ngang)
- `StatsDataGrid` theo loại + `StatsDrillDownDialog` → chi tiết phiếu
- Export Excel/PDF khi có quyền `export`
