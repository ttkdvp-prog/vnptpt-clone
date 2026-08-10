# Module: Nhân viên (Phase 3.1)

Vertical-slice reference. Standard: [`module-standard.md`](../module-standard.md).

## Paths

| Layer | Path |
|-------|------|
| Feature UI | `features/he-thong/nhan-vien/` |
| Client service | `features/he-thong/nhan-vien/services/nhan-vien-service.ts` |
| API client | `lib/api/he-thong.ts` (`apiGetEmployeesPage`, …) |
| Hono routes | `server/routes/nhan-vien.ts` |
| Repository | `server/repositories/nhan-vien.ts` |
| Server RBAC | `server/permissions/nhan-vien.ts` |
| Prisma | `prisma/schema.prisma` → `var_nhan_vien` |
| SQL alter | `scripts/sql/alter-var-nhan-vien-phase31.sql` |

## Field map (DB ↔ app)

| DB (`var_nhan_vien`) | App (`Employee`) |
|----------------------|------------------|
| `id` | `id` (string) |
| `ho_va_ten` | `ho_ten` |
| `email` | `email` |
| `email_ca_nhan` | `email_ca_nhan` |
| `so_dien_thoai` | `so_dien_thoai` |
| `gioi_tinh` | `gioi_tinh` |
| `hinh_anh` | `anh_dai_dien` |
| `ten_tai_khoan` | `ten_dang_nhap` — tên đăng nhập app, dùng trong `authorize()` (`auth.ts`) song song với mã NV/email |
| `mat_khau` | (server only) |
| `id_phong_ban` | `phong_ban_id` |
| `id_chuc_vu` | `chuc_vu_id` |
| `cap_bac` | `cap_bac` |
| `trang_thai` (ACTIVE/…) | `trang_thai` (Đang làm việc/…) |
| `must_change_password` | `must_change_password` |
| `ngay_sinh` / `so_cccd` / `ngay_cap_cccd` / `noi_cap_cccd` | identity |
| `dia_chi_thuong_tru` / `dia_chi_hien_tai` | addresses |
| `que_quan` / `dan_toc` / `ton_giao` / `tinh_trang_hon_nhan` / `quoc_tich` | demographics |
| `ngay_vao_lam` / `ngay_chinh_thuc` / `ngay_nghi_viec` / `ly_do_nghi` | employment dates |
| `so_tai_khoan` / `ten_chu_tai_khoan` / `ngan_hang` / `chi_nhanh` | bank |
| `nguoi_lien_he_khan` / `sdt_khan` / `moi_quan_he` | emergency contact |
| `so_so_bhxh` / `so_bhyt` / `ma_so_thue_ca_nhan` | insurance & tax |
| `trinh_do` / `chuyen_nganh` / `truong` | education |
| `nguoi_tao` | `nguoi_tao` |
| `tg_tao` / `tg_cap_nhat` | ISO strings |

SQL: `prisma/migrations/20260718090000_employee_hr_profile_fields/` · manual `scripts/sql/alter-var-nhan-vien-hr-profile.sql`

## API (api mode)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/nhan-vien?limit&offset&orderBy&ascending&search` | `xem` |
| GET | `/nhan-vien/:id` | `xem` (own row / self OK) |
| GET | `/nhan-vien/:id/ho-so.pdf` | `xem` (cùng luật `GET /:id`) — Chromium render A4 |
| GET | `/nhan-vien/:id/ho-so.docx` | `xem` (cùng luật `GET /:id`) — OOXML thật |
| GET | `/nhan-vien/by-login/:taiKhoan` | `xem` |
| POST | `/nhan-vien` | `them` |
| PATCH | `/nhan-vien/:id` | `sua` (creator OK without `sua`) |
| DELETE | `/nhan-vien/:id` | `xoa` (no creator bypass) |

Super: `cap_bac === 1`. Module key DB: `nhan_vien`.

## mock vs api

| | mock | api |
|--|------|-----|
| Data | `MockRepository` + `MOCK_EMPLOYEES` | Prisma |
| Pagination | client repo page | server `findEmployeesPage` |
| Auth account | mock employee-auth helpers | bcrypt on `mat_khau` |

## Detail drawer tabs

Detail nhân viên (`nhan-vien-detail.tsx`) có 3 tab:

| Tab | Nội dung |
|-----|----------|
| **Thông tin** | Toolbar + các section hồ sơ hiện tại + hệ thống |
| **Hợp đồng** | CRUD nhúng `ns_hop_dong` theo `id_nhan_vien` (quyền `contracts`) |
| **Quyết định** | Placeholder (module chưa có) |

---

## Checklist (Phase 3.1)

- [x] Prisma model (contact + audit fields)
- [x] SQL alter script
- [x] Repository
- [x] Service (mock \| api) — page API
- [x] Zod on Hono create/update body
- [x] Route Handlers
- [x] Permission client + server
- [x] List / Card / Detail / Create / Edit / Delete (UI existing)
- [x] Search / Filter / Sort / Pagination (server page in api)
- [x] Import / Export (persist email/phone/gender on create/update)
- [x] Audit fields
- [x] Tests (permission unit)
- [x] This documentation

Schema: dùng Prisma Migrate (`npm run db:migrate:deploy` / Docker entrypoint).  
SQL tay `scripts/sql/alter-var-nhan-vien-phase31.sql` là **legacy** — đã gộp vào baseline `prisma/migrations/`.
