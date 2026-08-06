# 0002 — Auth.js (Credentials)

## Status

Accepted

## Context

Cần đăng nhập nhân viên bằng tên đăng nhập + mật khẩu (không OAuth bắt buộc). Đã bỏ Supabase Auth.

## Options

1. Custom JWT cookie + tự quản session.
2. Auth.js (next-auth v5) Credentials provider + Prisma user/employee.
3. Better Auth / Lucia (stack mới).

## Decision

Dùng **Auth.js Credentials**: session JWT/cookie, hydrate client qua `SessionProvider` + `AuthSessionSynchronizer` → Zustand.

## Consequences

- Chuẩn Next (`app/api/auth/[...nextauth]`).
- Email giả từ `ten_dang_nhap` + suffix (`lib/auth-email.ts`).
- Phải đồng bộ Auth.js session với hồ sơ `var_nhan_vien` và ma trận quyền.
