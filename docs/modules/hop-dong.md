# Hợp đồng

Route: `/hanh-chinh/hop-dong`  
Resource: `contracts` → module `hanh-chinh/hop-dong` → DB key `hop_dong`

Module CRUD quản lý hợp đồng nhân sự (thử việc / chính thức) theo Pattern A
(filter chip trên toolbar), kèm trang preview/in A4 pháp lý mở từ detail.

## Dữ liệu

Bảng: `ns_hop_dong` (ID `Int` SERIAL; domain TS dùng `string`).

| Cột | Kiểu | Mô tả |
|-----|------|--------|
| `id` | INT PK | Tự tăng |
| `loai_hop_dong` | TEXT | `thu_viec` \| `chinh_thuc` |
| `ma_hop_dong` | TEXT UNIQUE | Mã hợp đồng |
| `ngay_ky` | DATE | Ngày ký |
| `ngay_hieu_luc` | DATE | Ngày hiệu lực |
| `ngay_ket_thuc` | DATE (nullable) | Ngày kết thúc |
| `id_nhan_vien` | INT FK → `var_nhan_vien` | Nhân viên |
| `id_chuc_vu` | INT FK → `var_chuc_vu` | Chức vụ (snapshot lúc ký) |
| `id_phong_ban` | INT FK → `var_phong_ban` | Phòng ban (snapshot lúc ký) |
| `muc_luong` | TEXT | Mức lương |
| `hinh_thuc_tra_luong` | TEXT | `theo_thang` \| `theo_ngay` \| `theo_gio` |
| `che_do_khac` | TEXT (nullable) | Chế độ khác |
| `noi_lam_viec` | TEXT (nullable) | Nơi làm việc |
| `thoi_gian_lam_viec` | TEXT (nullable) | Thời gian làm việc |
| `luu_y_khac` | TEXT (nullable) | Lưu ý khác |
| `ghi_chu` | TEXT (nullable) | Ghi chú |
| `trang_thai` | TEXT | `chua_xong` (mặc định) \| `da_xong` |
| `id_nguoi_tao` | INT (nullable) | Prisma field `nguoi_tao` |
| `tg_tao` / `tg_cap_nhat` | TIMESTAMPTZ | Audit |

Khi chọn nhân viên ở form, `id_chuc_vu` và `id_phong_ban` được tự điền từ hồ sơ
nhân viên nhưng **vẫn cho sửa** (lưu snapshot tại thời điểm ký).

### Dữ liệu phụ khi in (không snapshot trên `ns_hop_dong`)

Trang in đọc **live** từ:

| Nguồn | Field dùng trên HĐ |
|-------|---------------------|
| `var_cong_ty` / `companyInfo` | Tên, địa chỉ, MST, SĐT, `nguoi_dai_dien`, `chuc_vu_nguoi_dai_dien`, `dia_diem_ky` |
| `var_nhan_vien` | Họ tên, giới tính, SĐT, `ngay_sinh`, `so_cccd`, `ngay_cap_cccd`, `noi_cap_cccd`, `dia_chi_thuong_tru`, `dia_chi_hien_tai`, `so_so_bhxh` (+ HR: `email_ca_nhan`, quê quán, ngân hàng, … khi cần in) |

Migration: `prisma/migrations/20260718050000_employee_company_contract_fields/`.

## Filter

Loại hợp đồng, trạng thái, phòng ban + search (`ma_hop_dong`, tên nhân viên…).

## Permission

Matrix module `hanh-chinh/hop-dong`. Own-row: xem/sửa theo `nguoi_tao`; xóa cần
quyền `xoa`. Server mirror qua `assertHopDongPermission`.

## Preview / In / Tải xuống

- Nút **Xem / In** trên `DetailToolbar` (và row actions) → `openContractPrintTab(id)` mở tab
  `/in-hop-dong/:id`.
- Trang: `features/hanh-chinh/hop-dong/pages/contract-print-page.tsx`
  - Preview layout pháp lý A4 (Times New Roman, quốc hiệu, Bên A/B, Điều 1–5) —
    cả thử việc và chính thức dùng cùng template (khác nhãn loại HĐ).
  - **In** → `window.print()`
  - **Tải xuống** → Word (`.doc` HTML) + PDF (`jspdf.html()` từ DOM)
- Nội dung: `contract-print-content.tsx` + `utils/contract-document.ts` /
  `build-contract-view-model.ts` / `export-contract.ts` / `print-contract-pdf.ts`.
- Tham chiếu mẫu: `mau-hop-dong-lao-dong.html` (repo root).
- Path `/in-hop-dong` allowlist trong `proxy.ts`.

## SQL

- Prisma: `prisma/migrations/20260717070000_ns_hop_dong/` (kèm seed idempotent
  `INSERT ... WHERE NOT EXISTS`: hợp đồng thử việc / chính thức, cả `chua_xong`
  và `da_xong`).
- Identity/company fields: `20260718050000_employee_company_contract_fields/`.
- Triển khai: `npx prisma migrate deploy`.

## Ngoài phạm vi

Module Quyết định, import Excel hợp đồng, package `docx` OOXML thật, snapshot
identity lên `ns_hop_dong`.
