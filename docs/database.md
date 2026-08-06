# Database (lịch sử — đã thay bằng Google Sheets)

> **Đã thay thế.** App không còn dùng PostgreSQL/Prisma — data layer hiện là Google Sheets API
> (`lib/sheets/`), xem [`AGENTS.md`](../AGENTS.md) và [`deploy-vercel.md`](./deploy-vercel.md).
> Nội dung dưới đây giữ lại làm tham chiếu tên bảng/cột lịch sử (mỗi model cũ → 1 sheet tab cùng tên,
> xem `lib/sheets/config.ts` → `SHEET_TABS`), không còn phản ánh cách lưu trữ thật.

PostgreSQL + Prisma (lịch sử). Schema nguồn cũ: `prisma/schema.prisma` (đã xoá).

## Models chính (Hệ thống)

| Model | Bảng | Mô tả |
|-------|------|--------|
| `var_phong_ban` | Phòng ban (cây `id_cha`) |
| `var_chuc_vu` | Chức vụ + `cap_bac` |
| `var_nhan_vien` | Nhân viên + tài khoản đăng nhập |
| `var_cong_ty` | Thông tin công ty |
| `var_phan_quyen` | Ma trận quyền theo `chuc_vu_id` |
| `kh_thiet_lap_nhom_khach_hang` | Nhóm khách hàng (thiết lập) |
| `kh_thiet_lap_trang_thai` | Trạng thái khách hàng (thiết lập) |
| `kh_danh_sach_khach_hang` | Danh sách khách hàng (FK nhóm + trạng thái, mã unique) |
| `kh_nguoi_lien_he` | Người liên hệ (FK khách hàng; `ngay_sinh` YYYY hoặc YYYY-MM-DD) |
| `tai_lieu_thiet_lap_loai_tai_lieu` | Loại tài liệu (thiết lập; cột DB `id_nguoi_tao` ↔ Prisma `nguoi_tao`) |
| `tai_lieu_danh_sach_tai_lieu` | Danh sách tài liệu (FK loại; ACL `id_chuc_vu[]` / `id_nhan_vien[]`) |
| `sx_market_in` | Danh sách market in (FK khách hàng; workflow `cho_duyet`/`da_duyet`/`ngung_ap_dung`) |
| `cong_luong_phieu_hanh_chinh` | Phiếu hành chính (`ma_phieu` hardcode; FK NV; duyệt QL→HCNS; `hinh_anh` TEXT[]; buổi `sang`/`chieu`/`dem`) |

Tên cột/bảng theo nghiệp vụ tiếng Việt (`ho_va_ten`, `ma_phong_ban`, …) — mapper trong `server/mappers.ts`.

## Local Postgres (Docker)

```bash
docker compose up postgres -d
```

Mặc định (xem `docker-compose.yml`):

| Tham số | Giá trị mặc định |
|---------|------------------|
| Host port | `5433` → container `5432` |
| User | `anhungthinh` |
| Password | `changeme` (đổi trên VPS) |
| Database | `anhungthinh` |

Ví dụ `DATABASE_URL`:

```env
DATABASE_URL=postgresql://anhungthinh:changeme@localhost:5433/anhungthinh
```

Password có ký tự đặc biệt → URL-encode (`@` → `%40`).

## Prisma Migrate (chuẩn)

| Lệnh | Khi nào dùng |
|------|----------------|
| `npm run db:generate` | Sau khi đổi schema — bắt buộc trước build; `npm run dev` cũng chạy generate khi start |
| `npm run dev` | `prisma generate` + Next; **tự restart** khi sửa `prisma/schema.prisma` (tránh 500 `prisma.<model>` undefined) |
| `npm run db:migrate` / `db:migrate:dev` | **Dev:** tạo + apply migration mới (`prisma migrate dev`) |
| `npm run db:migrate:deploy` | **Prod / CI / Docker:** apply migrations đã commit (`prisma migrate deploy`) |
| `npm run db:migrate:status` | Kiểm tra trạng thái migration |
| `npm run db:push` | Escape hatch only — **không** dùng làm workflow chính |
| `npm run db:pull` | Introspect DB có sẵn → cập nhật schema (hiếm) |

### Dev (DB trống hoặc đã theo migrate)

```bash
docker compose up postgres -d
npm run db:migrate:dev
# hoặc lần đầu khi đã có migration trong repo:
npm run db:migrate:deploy
```

### Production (Docker Compose / Dokploy)

Image chạy `prisma migrate deploy` trong entrypoint trước khi start Next — **không** cần `db push` tay trên VPS.

**Prod chỉ qua Prisma Migrate:** commit thư mục `prisma/migrations/` → redeploy. **Không** chạy [`scripts/sql/`](../scripts/sql/) trên DB production trước deploy (dễ khiến `CREATE TABLE` fail → container không start → **502**).

Checklist trước / sau deploy:

```bash
npm run db:migrate:status   # DB prod: không còn failed / pending lệch
# sau redeploy: https://<domain>/health → {"ok":true,"db":true}
```

### DB cũ đã tạo bằng `db push` / SQL tay

Sau khi pull code có `prisma/migrations/`, cần đánh dấu baseline đã apply (tránh P3005 / table already exists):

```bash
npx prisma migrate resolve --applied 20260716000000_init
```

Entrypoint / `npm start` / `npm run db:migrate:deploy` (`scripts/prisma-migrate-deploy.mjs`) tự recover:

| Lỗi | Hành vi |
|-----|---------|
| **P3005** (schema không trống, chưa có history) | Baseline `20260716000000_init` một lần rồi `deploy` lại |
| **P3009 / P3018** + Postgres **42P07** (`already exists`) | `migrate resolve --applied <migration>` rồi retry (tối đa 10 lần). Với **P3009**, script đọc `_prisma_migrations.logs` vì CLI không in lại lỗi Postgres gốc |
| **P3009** failed migration (stuck) | Nếu schema đã đúng mục tiêu → `--applied`; không thì `--rolled-back` rồi `deploy` lại (migration SQL idempotent, tối đa 3 lần). Ví dụ: `20260718070000_drop_loai_phieu_hardcode` |
| Lỗi schema khác (FK, cột thiếu, …) | **Fail hard** — không start app |

Nếu đã chạy SQL tay khẩn cấp trên prod trước khi có recovery: có thể `npx prisma migrate resolve --applied <ten_migration>` thủ công, hoặc redeploy để script tự xử lý khi lỗi là `already exists` / failed migration stuck.

## Legacy SQL scripts

[`scripts/sql/`](../scripts/sql/) + [`scripts/apply-sql-migration.mjs`](../scripts/apply-sql-migration.mjs) là **deprecated / emergency only** (local hoặc hotfix). Schema chính thức nằm trong `prisma/migrations/`. **Không** dùng SQL tay trên production như bước chuẩn trước deploy.

## Client Prisma & boundary

```
UI → Query Hook → Feature Service → API (lib/api)
  → Hono route → server/repositories → Prisma (server/db.ts) → PostgreSQL
```

- Prisma singleton: `server/db.ts`.
- **Chỉ** `server/repositories/*` (và infra như health check) gọi Prisma.
- Feature components / hooks / views **không** import `@prisma/client` hay `@/server/**`.
- Auth.js (`auth.ts`) gọi repository nhân viên — không gọi Prisma trực tiếp.

## Quyền ở tầng dữ liệu

- Super: `cap_bac = 1` trên chức vụ đăng nhập.
- Ma trận: cột quyền theo module trong `var_phan_quyen`.
- Own-row: `nguoi_tao` (xem + sửa; xóa vẫn cần `xoa`).

Chi tiết enforce: [`patterns-permissions.md`](./patterns-permissions.md), [`authentication.md`](./authentication.md).

## Checklist khi thêm entity

1. Thêm model vào `prisma/schema.prisma`.
2. `npm run db:migrate:dev` (đặt tên migration) — commit thư mục `prisma/migrations/`.
3. Mapper + Hono route + `server/repositories` + feature service.
4. Query keys + permissions module_id.
5. Checklist UI: [`checklist-module.md`](./checklist-module.md).
