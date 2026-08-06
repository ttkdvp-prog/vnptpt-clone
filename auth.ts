import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { encode as defaultJwtEncode } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import { findEmployeeAuthByLogin } from '@/server/repositories/nhan-vien';
import {
  REMEMBER_SESSION_MAX_AGE,
  parseRememberFlag,
  resolveSessionMaxAge,
} from '@/lib/employee-auth/session-lifetime';
import type { User as AppUser } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: AppUser;
  }
  interface User extends AppUser {
    emailVerified?: Date | null;
    /** Lựa chọn "Ghi nhớ đăng nhập" — chuyển từ authorize() sang callback jwt. */
    remember?: boolean;
  }
}

/** Client-safe Auth.js error — surfaces as CredentialsSignin + code (not Configuration). */
class AccountDisabledError extends CredentialsSignin {
  code = 'account_disabled';
}

function resolveAuthSecret(): string | undefined {
  const secret = (process.env.AUTH_SECRET ?? process.env.JWT_SECRET)?.trim();
  return secret || undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  session: { strategy: 'jwt', maxAge: REMEMBER_SESSION_MAX_AGE },
  jwt: {
    maxAge: REMEMBER_SESSION_MAX_AGE,
    /**
     * `encode` mặc định luôn lấy exp = now + maxAge tĩnh của config, nên hạn phiên
     * theo từng lần đăng nhập phải override ở đây dựa trên `token.remember`.
     */
    encode(params) {
      const remember = (params.token as { remember?: boolean } | undefined)?.remember;
      return defaultJwtEncode({ ...params, maxAge: resolveSessionMaxAge(remember) });
    },
  },
  pages: {
    signIn: '/dang-nhap',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        tai_khoan: { label: 'Tài khoản', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' },
        remember: { label: 'Ghi nhớ đăng nhập', type: 'text' },
      },
      async authorize(credentials) {
        const taiKhoan = String(credentials?.tai_khoan ?? '')
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? '');
        const remember = parseRememberFlag(credentials?.remember);
        if (!taiKhoan || !password) return null;

        try {
          const row = await findEmployeeAuthByLogin(taiKhoan);
          if (!row) return null;

          if (String(row.trang_thai).toUpperCase() === 'INACTIVE') {
            throw new AccountDisabledError();
          }

          const hash = row.mat_khau?.trim();
          if (!hash) return null;

          let ok = false;
          try {
            ok = await bcrypt.compare(password, hash);
          } catch {
            // Invalid hash format in DB — treat as failed login, not Configuration
            return null;
          }
          if (!ok) return null;

          return {
            id: `api-${row.id}`,
            employee_id: String(row.id),
            email: `${row.tai_khoan}@local`,
            ten_dang_nhap: row.tai_khoan,
            full_name: row.ho_va_ten,
            avatar_url: row.hinh_anh ?? undefined,
            role: 'user',
            created_at: new Date().toISOString(),
            id_phong_ban: row.id_phong_ban != null ? String(row.id_phong_ban) : undefined,
            id_chuc_vu: row.id_chuc_vu != null ? [String(row.id_chuc_vu)] : undefined,
            // Đọc từ DB, KHÔNG hardcode. Trước đây cố định `false` nên toàn bộ
            // luồng buộc đổi mật khẩu (trang /doi-mat-khau-bat-buoc, guard ở
            // ProtectedRoute, allowlist proxy.ts) là code chết ở chế độ API.
            must_change_password: row.must_change_password ?? false,
            tai_khoan_dang_hoat_dong: true,
            cap_bac: row.cap_bac,
            remember,
          };
        } catch (err) {
          if (err instanceof CredentialsSignin) throw err;
          // Prisma / unexpected — log server-side; Auth.js maps other throws → Configuration
          console.error('[auth] authorize failed:', err);
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.employee_id = user.employee_id;
        token.ten_dang_nhap = user.ten_dang_nhap;
        token.full_name = user.full_name;
        token.avatar_url = user.avatar_url;
        token.id_phong_ban = user.id_phong_ban;
        token.id_chuc_vu = user.id_chuc_vu;
        token.must_change_password = user.must_change_password;
        token.tai_khoan_dang_hoat_dong = user.tai_khoan_dang_hoat_dong;
        token.cap_bac = user.cap_bac;
        token.remember = user.remember !== false;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as typeof token & {
        employee_id?: string;
        ten_dang_nhap?: string | null;
        full_name?: string;
        avatar_url?: string;
        id_phong_ban?: string;
        id_chuc_vu?: string[];
        must_change_password?: boolean;
        tai_khoan_dang_hoat_dong?: boolean;
        cap_bac?: number | null;
      };
      // Credentials JWT session — AdapterUser fields unused
      const appUser: AppUser = {
        id: `api-${t.employee_id}`,
        employee_id: String(t.employee_id ?? ''),
        email: `${t.ten_dang_nhap ?? 'user'}@local`,
        ten_dang_nhap: t.ten_dang_nhap ?? undefined,
        full_name: t.full_name ?? '',
        avatar_url: t.avatar_url,
        role: 'user',
        created_at: new Date().toISOString(),
        id_phong_ban: t.id_phong_ban,
        id_chuc_vu: t.id_chuc_vu,
        must_change_password: t.must_change_password,
        tai_khoan_dang_hoat_dong: t.tai_khoan_dang_hoat_dong,
        cap_bac: t.cap_bac ?? null,
      };
      session.user = appUser as typeof session.user;
      return session;
    },
  },
});
