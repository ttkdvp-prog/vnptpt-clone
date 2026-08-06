import type { Context, Next } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { SignJWT, jwtVerify } from 'jose';
import { INTERNAL_PROOF_HEADER, verifyInternalProof } from './internal-headers';

const COOKIE_NAME = 'aht_session';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface JwtPayload {
  employee_id: string;
  tai_khoan: string;
  cap_bac: number | null;
}

function getSecret(): Uint8Array {
  const secret = (process.env.AUTH_SECRET ?? process.env.JWT_SECRET)?.trim();
  if (!secret) {
    throw new Error('AUTH_SECRET or JWT_SECRET is required');
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({
    employee_id: payload.employee_id,
    tai_khoan: payload.tai_khoan,
    cap_bac: payload.cap_bac,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const employeeId = payload.employee_id;
    const taiKhoan = payload.tai_khoan;
    if (typeof employeeId !== 'string' || typeof taiKhoan !== 'string') return null;
    const capBac =
      typeof payload.cap_bac === 'number'
        ? payload.cap_bac
        : payload.cap_bac == null
          ? null
          : Number(payload.cap_bac);
    return {
      employee_id: employeeId,
      tai_khoan: taiKhoan,
      cap_bac: Number.isFinite(capBac as number) ? (capBac as number) : null,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, COOKIE_NAME, { path: '/' });
}

/**
 * Prefer Auth.js-injected headers (Next mount), then Bearer / legacy cookie.
 *
 * Nhánh header CHỈ được tin khi kèm proof dẫn xuất từ AUTH_SECRET — xem
 * server/internal-headers.ts. Thiếu/sai proof thì rơi xuống cookie/Bearer, nên
 * kẻ giả mạo không có phiên thật sẽ nhận 401 ở `requireAuth`.
 */
export async function readSession(c: Context): Promise<JwtPayload | null> {
  const fromHeaderId = c.req.header('x-aht-employee-id')?.trim();
  if (fromHeaderId && verifyInternalProof(c.req.header(INTERNAL_PROOF_HEADER)?.trim())) {
    const taiKhoan = c.req.header('x-aht-tai-khoan')?.trim() ?? '';
    const capRaw = c.req.header('x-aht-cap-bac')?.trim();
    const capBac = capRaw === '' || capRaw == null ? null : Number(capRaw);
    return {
      employee_id: fromHeaderId,
      tai_khoan: taiKhoan,
      cap_bac: Number.isFinite(capBac as number) ? (capBac as number) : null,
    };
  }

  const fromCookie = getCookie(c, COOKIE_NAME);
  const auth = c.req.header('Authorization');
  const fromBearer =
    auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : undefined;
  const token = fromBearer || fromCookie;
  if (!token) return null;
  return verifySessionToken(token);
}

export type AuthVariables = {
  session: JwtPayload;
};

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const session = await readSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('session', session);
  await next();
}

/**
 * Session auth, or shared `UPLOAD_API_KEY` via `X-Upload-Key`
 * (local Next proxies uploads to VPS without browser CORS/cookies).
 */
export async function requireAuthOrUploadKey(
  c: Context,
  next: Next,
): Promise<Response | void> {
  const configured = process.env.UPLOAD_API_KEY?.trim();
  const provided = c.req.header('x-upload-key')?.trim();
  if (configured && provided && provided === configured) {
    c.set('session', {
      employee_id: 'upload-key',
      tai_khoan: 'upload-key',
      cap_bac: 1,
    });
    await next();
    return;
  }
  return requireAuth(c, next);
}
