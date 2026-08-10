# Module Tài liệu (`cong-viec/tai-lieu`)

Đăng ký hồ sơ tài liệu (hợp đồng, công văn nội bộ...), sống trong submenu
**Công việc** (`/cong-viec/danh-sach-tai-lieu`, `/cong-viec/thong-ke-tai-lieu`).

## Data model — sheet `tai_lieu`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | số, tự sinh (`nextId`) | Không dùng định dạng `doc-YYMMDDHHmmss` cũ |
| `so_ho_so` | số | **Bằng `id`** — đơn giản hóa 1 counter duy nhất, không đánh số lại theo năm. Muốn đổi thì sửa `createTaiLieu` trong `server/repositories/tai-lieu.ts` |
| `ten_ho_so` | text, bắt buộc | |
| `danh_muc` | text tự do, bắt buộc | Combobox gợi ý distinct giá trị đã dùng (`getDistinctDanhMuc`) — không có bảng danh mục riêng |
| `to` | text, bắt buộc | Dropdown đóng, nguồn = distinct `id_phong_ban` trong `var_nhan_vien` (`getDistinctIdPhongBan`) |
| `ngay_ban_hanh` | date, bắt buộc | |
| `ngay_ket_thuc` | date, tùy chọn | Nếu có, phải `>= ngay_ban_hanh` |
| `tinh_trang` | enum, bắt buộc | `Đang hiệu lực` / `Hết hiệu lực` / `Dự thảo` — badge màu |
| `url` | text, tùy chọn | Dán link Google Docs/Drive tay, không tích hợp Drive API |
| `mo_ta` | text, tùy chọn | |
| `nguoi_tao`, `tg_tao`, `tg_cap_nhat` | hệ thống | Server set, hiển thị read-only |

## Permissions

- `AppResource: 'tai-lieu'` → module id `cong-viec/tai-lieu` (`lib/permissions.ts`).
- Đăng ký trong ma trận Phân quyền tại `features/he-thong/phan-quyen/core/permission-modules-config.ts`
  (nhóm "Công việc").
- Route server (`server/routes/tai-lieu.ts`) tự kiểm tra quyền qua matrix token,
  không chỉ dựa vào `useCan` phía client.

## API endpoints (`server/routes/tai-lieu.ts`)

`GET /tai-lieu` (list, phân trang + filter) · `GET /tai-lieu/count` ·
`GET /tai-lieu/filter-counts` · `GET /tai-lieu/stats-aggregates` ·
`GET /tai-lieu/distinct-danh-muc` · `GET /tai-lieu/:id` · `POST /tai-lieu` ·
`PUT /tai-lieu/:id` · `DELETE /tai-lieu/:id` · `POST /tai-lieu/delete-batch`.

Dropdown `to` dùng chung endpoint `GET /nhan-vien/distinct-phong-ban` (dữ liệu
thuộc `var_nhan_vien`, không nhân bản sang route tai-lieu).

## Không tái dùng (tàn dư module cũ)

- `lib/text/tai-lieu.ts` (`taiLieu.*`) — mô hình văn bản đến/đi khác hoàn
  toàn, không liên quan. Module này dùng namespace riêng `congViecTaiLieu.*`.
- `server/mappers.ts` `DbLoaiTaiLieu`/`DbDanhSachTaiLieu` — thiết kế
  Postgres/FK cũ, dead code, không import.
- `lib/query-keys.ts` nhánh `documents`/`document-types` — mồ côi từ module
  hành-chính đã xóa, module này dùng nhánh `taiLieu` riêng.

## Ngoài phạm vi đợt này

Import/export hàng loạt, bulk actions, tích hợp Google Drive upload, submenu
quản lý danh mục riêng ("Thiết lập tài liệu"), drill-down thống kê.
