# Tổng quan

Routes:
- `/tong-quan` — **dashboard app** (layout chung): KPI + bảng phòng ban + nghỉ/công tác hôm nay; nút **Live TV**
- `/tong-quan/tv` — **Live TV** fullscreen wallboard (ẩn sidebar/topbar)

Không có `AppResource` riêng — mọi user đã đăng nhập đều xem được.

## Dashboard (`/tong-quan`)

Style giống tab Thống kê: một card chính chia **2 cột**.

- Cột trái: chức năng (Nhân sự | Sản xuất | Chất lượng | An toàn)
- Cột phải: dữ liệu — `DashboardToolbar` + KPI; dưới đó **2 cột**: roster nhân viên (trái, `fillHeight`) | theo phòng ban + theo chức vụ xếp dọc (phải)
- Toolbar Nhân sự: lọc phòng ban, trạng thái hôm nay (`lam_viec` / `cong_tac` / `nghi`)

## Live TV (`/tong-quan/tv`)

| # | Slide | Dữ liệu |
|---|--------|---------|
| 1 | Nhân sự | KPI + bảng roster (scroll) + panel theo phòng ban — 1 viewport |
| 2 | Sản xuất | Đang xây dựng |
| 3 | Chất lượng | Đang xây dựng |
| 4 | An toàn & 5S | Đang xây dựng |

Xoay **18 giây**. Nút **Giữ**. Phím: `Space` · `←` `→` · `Esc` về `/tong-quan`.

Visual: **dark ERP 5F** — `primary` + semantic status, `rounded-lg`/`rounded-xl`, không glow teal.
Header: logo · tiêu đề · đồng hồ / thời tiết (chip) · rail trái (active primary).
Thông báo: 1 dòng marquee sát đáy (nhãn `bg-primary`).
KPI: icon tile + số + thanh progress đơn giản; roster `h-fit` khi ít dòng.

Env weather: `NEXT_PUBLIC_TV_WEATHER_LAT` / `LON` / `LOCATION` (mặc định Bình Dương).

## Nguồn dữ liệu Nhân sự

- Workforce: `trang_thai ∈ {Đang làm việc, Thử việc}`
- Nghỉ: phiếu `XN/NL/NB` + `da_duyet` + overlap hôm nay
- Công tác: phiếu `CT` + cùng điều kiện
- Roster status: `lam_viec` | `cong_tac` | `nghi`

## Feature

`features/tong-quan/` — `mode: 'embedded' | 'tv'` → dashboard light hoặc wallboard.
