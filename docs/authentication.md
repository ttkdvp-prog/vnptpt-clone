# Authentication

Auth.js (NextAuth v5) + Credentials provider. Đăng nhập bằng tài khoản nhân viên (`var_nhan_vien`), không dùng OAuth mặc định.

## Thành phần

| File / module | Vai trò |
|---------------|---------|
| `auth.ts` | Cấu hình Auth.js (Next) |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js HTTP handlers |
| `server/auth.ts` | Helpers auth phía Hono/API |
| `lib/employee-auth/*` | Login session, đổi mật khẩu, restore |
| `components/auth/AuthSessionSynchronizer.tsx` | Hydrate Zustand từ session |
| `components/auth/ProtectedRoute.tsx` | Guard UI |
| `components/auth/ModulePermissionRoute.tsx` | Guard theo module matrix |
| `proxy.ts` | Proxy / host trust liên quan request |

## Biến môi trường

| Biến | Vai trò |
|------|---------|
| `AUTH_SECRET` | Ký cookie/session Auth.js — **bắt buộc**, chuỗi dài ngẫu nhiên |
| `JWT_SECRET` | Secret JWT phía server/Hono |
| `AUTH_TRUST_HOST` | `true` khi deploy sau reverse proxy HTTPS |
| `NEXT_PUBLIC_AUTH_EMAIL_SUFFIX` | Optional suffix email nội bộ |
| `NEXT_PUBLIC_ADMIN_POSITION_MA` | Optional mã chức vụ admin (dev) |
| `NEXT_PUBLIC_USE_PERMISSION_MATRIX` | Bật hydrate ma trận từ `var_phan_quyen` |

## Luồng đăng nhập (tóm tắt)

```
Login form (views/Login)
    → Auth.js Credentials
    → Kiểm tra tài khoản / mật khẩu (bcrypt) trên var_nhan_vien
    → Session cookie
    → AuthSessionSynchronizer → Zustand
    → useHydratePositionPermissions → grantsByModule + positionCapBac
    → Vào app/(app)/*
```

Đổi mật khẩu bắt buộc: route `doi-mat-khau-bat-buoc` / `views/ForceChangePassword.tsx`.

## Phân quyền (sau login)

1. **Super:** `cap_bac === 1` trên chức vụ đăng nhập → full CRUD mọi module.
2. **Module admin:** token `admin` / `all` trên module.
3. **CRUD tokens:** `xem` / `them` / `sua` / `xoa`.
4. **Own row (`nguoi_tao`):** xem + sửa dòng mình tạo; xóa vẫn cần `xoa`.

**Không** dùng `User.role` để authorize.

Chi tiết: [`patterns-permissions.md`](./patterns-permissions.md).

## Client vs server

| Lớp | Trách nhiệm |
|-----|-------------|
| Client `can()` / hooks | Ẩn nút, ẩn nav — **chỉ UX** |
| Hono routes + session | Enforce thật — bắt buộc |

Khi thêm API mới: luôn kiểm session + quyền tương đương client.

## Modes dữ liệu

- `NEXT_PUBLIC_DATA_SOURCE=mock` — có thể login/dev với mock (xem service auth mock).
- `api` — session + Prisma thật.

## Bảo mật khi deploy

1. Đổi `AUTH_SECRET`, `JWT_SECRET`, password Postgres.
2. HTTPS + `AUTH_TRUST_HOST=true`.
3. Không đưa secret vào biến `NEXT_PUBLIC_*`.
4. Cloudinary: chỉ unsigned upload preset trên client.

Xem thêm: [`deployment.md`](./deployment.md).
