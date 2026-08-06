import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Hợp đồng header nội bộ giữa Next route handler và Hono app.
 *
 * `forwardToHono` (lib/api/hono-next-handler.ts) là NGUỒN DUY NHẤT hợp lệ của các
 * header này; `readSession` (server/auth.ts) là nơi duy nhất đọc chúng. Đặt cả hai
 * đầu vào một file để producer/consumer không bao giờ lệch nhau.
 *
 * Lịch sử: trước đây `forwardToHono` dùng `new Headers(req.headers)` rồi chỉ GHI ĐÈ
 * các header này khi có session Auth.js. Không có session thì header do client gửi
 * sống nguyên, và `readSession` tin chúng vô điều kiện ⇒ bất kỳ ai cũng gửi được
 * `x-aht-employee-id: 1` + `x-aht-cap-bac: 1` để thành super admin mà không cần
 * đăng nhập (`cap_bac === 1` là cổng super ở server/permissions/assert-module.ts).
 *
 * Hai lớp phòng vệ, cố ý giữ cả hai:
 *  1. `stripInternalHeaders` — xoá mọi bản do client gửi vào, ở đúng biên tin cậy.
 *  2. `INTERNAL_PROOF_HEADER` — chỉ tiến trình biết AUTH_SECRET mới tạo được, nên
 *     listener độc lập `server/index.ts` (API_PORT, không đi qua forwardToHono)
 *     cũng không còn tin header thô từ bất kỳ ai chạm được cổng.
 */
export const INTERNAL_SESSION_HEADERS = [
  'x-aht-employee-id',
  'x-aht-tai-khoan',
  'x-aht-cap-bac',
] as const;

export const INTERNAL_PROOF_HEADER = 'x-aht-internal';

/** Đổi chuỗi thì mọi proof cũ hết hiệu lực — coi như xoay khoá. */
const PROOF_MESSAGE = 'aht-internal-session-v1';

function readSecret(): string | null {
  return (process.env.AUTH_SECRET ?? process.env.JWT_SECRET)?.trim() || null;
}

/**
 * HMAC dẫn xuất từ AUTH_SECRET. Trả `null` khi thiếu secret — lúc đó nhánh header
 * bị vô hiệu hoàn toàn (fail closed), request phải dùng cookie/Bearer.
 */
export function computeInternalProof(): string | null {
  const secret = readSecret();
  if (!secret) return null;
  return createHmac('sha256', secret).update(PROOF_MESSAGE).digest('hex');
}

/** So sánh hằng thời gian; sai độ dài hoặc thiếu secret đều là không hợp lệ. */
export function verifyInternalProof(candidate: string | undefined): boolean {
  if (!candidate) return false;
  const expected = computeInternalProof();
  if (!expected) return false;

  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Xoá mọi header nội bộ do client gửi vào. PHẢI gọi trước khi tự set —
 * nếu không thì bản của client sống sót ở nhánh không có session.
 */
export function stripInternalHeaders(headers: Headers): void {
  for (const name of INTERNAL_SESSION_HEADERS) headers.delete(name);
  headers.delete(INTERNAL_PROOF_HEADER);
}
