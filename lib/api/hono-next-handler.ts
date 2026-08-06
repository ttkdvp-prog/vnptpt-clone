import { auth } from '@/auth';
import { honoApp } from '@/server/hono-app';
import {
  INTERNAL_PROOF_HEADER,
  computeInternalProof,
  stripInternalHeaders,
} from '@/server/internal-headers';

/**
 * Forward browser request to the embedded Hono app, injecting trusted
 * Auth.js session headers so `requireAuth` can authorize without legacy JWT.
 *
 * Đây là biên tin cậy: mọi header nội bộ do client gửi vào phải bị xoá TRƯỚC khi
 * ta tự set. Xem server/internal-headers.ts để biết lỗ hổng mà việc này vá.
 */
export async function forwardToHono(req: Request): Promise<Response> {
  const session = await auth();
  const headers = new Headers(req.headers);

  // Không tin gì từ client ở nhóm header này — kể cả khi dưới đây không set lại.
  stripInternalHeaders(headers);

  if (session?.user?.employee_id) {
    const proof = computeInternalProof();
    if (proof) {
      headers.set('x-aht-employee-id', session.user.employee_id);
      headers.set('x-aht-tai-khoan', session.user.ten_dang_nhap ?? '');
      headers.set(
        'x-aht-cap-bac',
        session.user.cap_bac == null ? '' : String(session.user.cap_bac),
      );
      headers.set(INTERNAL_PROOF_HEADER, proof);
    }
  }

  const url = new URL(req.url);
  const init: RequestInit & { duplex?: 'half' } = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body;
    init.duplex = 'half';
  }

  return honoApp.fetch(new Request(url, init));
}

export function createHonoRouteHandlers() {
  const handler = (req: Request) => forwardToHono(req);
  return {
    GET: handler,
    POST: handler,
    PATCH: handler,
    PUT: handler,
    DELETE: handler,
    OPTIONS: handler,
  };
}
