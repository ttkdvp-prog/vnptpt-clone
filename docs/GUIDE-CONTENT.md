# Quy ước nội dung trang Hướng dẫn module

## Nguyên tắc

- **Mọi module** (trang chức năng con trong submenu) **nên có trang hướng dẫn** khi module production-ready.
- **Template phase 1 (Hệ thống):** các module Hệ thống đã có guide trong `locales/guide.json` (Nhân viên, Phòng ban, Chức vụ, Thông tin công ty, Phân quyền). Domain mới: bổ sung guide theo checklist dưới.

## Nơi lưu nội dung

- **Chuỗi giao diện (tiếng Việt):** `locales/guide.json`

Key theo cấu trúc: `guide.modules.{submenu}_{moduleSlug}.{section}`

- `submenu`: camelCase của đường dẫn submenu (vd. `hanhChinh`, `nhanSu`).
- `moduleSlug`: camelCase của slug module (vd. `chamCong`, `phieuHanhChinh`).
- `section`: `intro`, `overview`, `permissions`, `workflow`, `quickStart`, `glossary`, `faq`, `contact`.

Ví dụ: `guide.modules.hanhChinh_chamCong.overview`

## Các section bắt buộc

| Key | Mô tả |
|-----|--------|
| `intro` | Một câu ngắn hiển thị dưới tiêu đề trang (hero). |
| `overview` | Giới thiệu module: mục đích, đối tượng sử dụng (1–2 đoạn). |
| `permissions` | Phân quyền: ai được xem, tạo, sửa, xóa, duyệt, xuất, quản trị (bám ActionType trong phân quyền). |
| `workflow` | Luồng thao tác: trình tự từ tạo → gửi → duyệt → hoàn tất; các trạng thái. |
| `quickStart` | 3–5 bước sử dụng nhanh: vào module → thao tác chính. |
| `glossary` | Thuật ngữ: giải thích ngắn các từ chuyên môn của module. |
| `faq` | 2–4 câu hỏi thường gặp (vd. tại sao không thấy nút X, làm sao sửa Y). |
| `contact` | Một dòng liên hệ hỗ trợ (vd. bộ phận HCNS, IT). |

Nếu chưa có key cho module, trang hướng dẫn sẽ hiển thị fallback: "Nội dung hướng dẫn đang được cập nhật."

## Module đã có hướng dẫn

### Hệ thống

- **nhan-vien** (`heThong_nhanVien`) — Nhân viên
- **phong-ban** (`heThong_phongBan`) — Phòng ban
- **chuc-vu** (`heThong_chucVu`) — Chức vụ
- **thong-tin-cong-ty** (`heThong_thongTinCongTy`) — Thông tin công ty
- **phan-quyen** (`heThong_phanQuyen`) — Phân quyền

### Kinh doanh

- **khach-hang** (`kinhDoanh_khachHang`) — Danh sách khách hàng
- **nguoi-lien-he** (`kinhDoanh_nguoiLienHe`) — Người liên hệ
- **thiet-lap-khach-hang** (`kinhDoanh_thietLapKhachHang`) — Thiết lập khách hàng

### Sản xuất

- **danh-sach-market-in** (`sanXuat_danhSachMarketIn`) — Danh sách market in

### Hành chính (kế hoạch / khi triển khai)

Các module sau dự kiến có đủ section trong `guide.json`:

**Công lương**

- **phieu-hanh-chinh** (Phiếu hành chính)
- **cham-diem-kpi** (Chấm điểm KPI)
- **bang-cong** (Bảng công)
- **bang-luong** (Bảng lương)
- **thiet-lap-cong-luong** (Thiết lập công lương)

**Quản lý tài liệu**

- **danh-sach-tai-lieu** (Danh sách tài liệu)
- **thong-ke-tai-lieu** (Thống kê tài liệu)
- **thiet-lap-tai-lieu** (Thiết lập tài liệu)

## Checklist khi thêm module mới

1. Implement module (route, page, nghiệp vụ).
2. Thêm key `guide.modules.{submenu}_{moduleSlug}.intro` (và các section còn lại) vào `locales/guide.json`.
3. Đảm bảo slug module trùng với `moduleId` dùng trong menu (vd. `lib/hanh-chinh-nav-config.ts`) để nút "Hướng dẫn" mở đúng trang.

## Checklist khi cập nhật module

1. Cập nhật code / nghiệp vụ của module.
2. Chỉnh lại nội dung hướng dẫn tương ứng trong `locales/guide.json` (overview, workflow, quickStart, permissions, faq…) cho đúng với thay đổi.
3. Nếu thêm trạng thái, bước duyệt hoặc quyền mới, cập nhật section **Phân quyền** và **Luồng thao tác**.
