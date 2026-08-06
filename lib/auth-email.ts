/**
 * Auth yêu cầu email. Người dùng chỉ nhập "tên đăng nhập" (local part);
 * chuỗi gửi lên Auth = local + hậu tố cố định.
 */
import { normalizeLoginName } from '@/lib/validation/login-name';

export const AUTH_EMAIL_SUFFIX =
  process.env.NEXT_PUBLIC_AUTH_EMAIL_SUFFIX?.trim() || '@gmail.com';

/**
 * Chuyển tên đăng nhập thành email dùng cho Auth (Credentials / session).
 * Nếu người dùng dán cả địa chỉ, chỉ lấy phần trước @ rồi gắn hậu tố.
 */
export function loginNameToAuthEmail(loginName: string): string {
  const t = loginName.trim();
  if (!t) return t;
  const local = t.includes('@') ? t.split('@')[0]!.trim() : t;
  return `${local}${AUTH_EMAIL_SUFFIX}`;
}

/** Lấy ten_dang_nhap từ email Auth (local part, chuẩn hóa). */
export function authEmailToLoginName(email: string): string {
  const local = email.split('@')[0]?.trim() ?? '';
  return normalizeLoginName(local);
}
