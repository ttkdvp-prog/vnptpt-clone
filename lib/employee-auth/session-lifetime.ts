/**
 * Tuổi thọ phiên đăng nhập theo lựa chọn "Ghi nhớ đăng nhập".
 *
 * Dùng chung cho cả 3 nơi quyết định phiên sống bao lâu:
 * - `auth.ts`: hạn của JWT (server-side)
 * - `app/api/auth/remember/route.ts`: hạn của cookie (browser-side)
 * - `store/useStore.ts`: chọn localStorage hay sessionStorage cho zustand persist
 *
 * Không import gì từ server để test và client đều dùng được.
 */

/** Khóa localStorage lưu lựa chọn ghi nhớ. Chỉ nhận 'true' | 'false'; thiếu key = ghi nhớ. */
export const AUTH_REMEMBER_KEY = 'auth-remember';

/** Key zustand persist của auth store. */
export const AUTH_STORAGE_KEY = 'auth-storage';

/** Có ghi nhớ: 30 ngày, cookie persistent — sống qua đóng trình duyệt. */
export const REMEMBER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/** Không ghi nhớ: 12 giờ, cookie phiên — đóng trình duyệt là mất. */
export const SHORT_SESSION_MAX_AGE = 60 * 60 * 12;

/** Hạn JWT (giây) theo lựa chọn. Thiếu/không rõ → coi như có ghi nhớ. */
export function resolveSessionMaxAge(remember: boolean | undefined | null): number {
  return remember === false ? SHORT_SESSION_MAX_AGE : REMEMBER_SESSION_MAX_AGE;
}

/** Parse cờ remember gửi kèm credentials (Auth.js truyền mọi field dưới dạng string). */
export function parseRememberFlag(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  return String(raw ?? '').toLowerCase() !== 'false';
}

/**
 * Tên cookie session token của Auth.js, kể cả bản chia nhỏ (`.0`, `.1`…)
 * và tiền tố `__Secure-` khi chạy https.
 */
const SESSION_TOKEN_COOKIE_RE = /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?$/;

export function isSessionTokenCookieName(name: string): boolean {
  return SESSION_TOKEN_COOKIE_RE.test(name);
}
