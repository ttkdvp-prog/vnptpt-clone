import type { Context } from 'hono';
import type { JwtPayload } from '@/server/auth';
import { parseQuyenCsv } from '@/lib/permission-db-keys';
import { findEmployeeChucVuId } from '@/server/repositories/nhan-vien';
import { findQuyenCsvByChucVuAndModule } from '@/server/repositories/phan-quyen';

const MODULE_NHAN_VIEN = 'nhan_vien';

export type ModuleAction = 'xem' | 'them' | 'sua' | 'xoa';

interface Grant {
  session: JwtPayload;
  tokens: string[];
  isAdmin: boolean;
}

/**
 * Memo theo từng request. Phân quyền theo trường (nhan-vien-fields.ts) khiến
 * PATCH phải hỏi 2-3 câu về quyền; không memo là mỗi câu +2 query.
 * WeakMap trên chính context để không phải mở rộng `AuthVariables`.
 */
const grantCache = new WeakMap<Context, Grant | null>();

function isModuleAdmin(tokens: string[]): boolean {
  return tokens.includes('admin') || tokens.includes('tat_ca') || tokens.includes('all');
}

/** `null` = không có phiên, hoặc không tra được chức vụ ⇒ không có quyền gì. */
async function loadGrant(c: Context): Promise<Grant | null> {
  if (grantCache.has(c)) return grantCache.get(c) ?? null;

  const session = c.get('session') as JwtPayload | undefined;
  let grant: Grant | null = null;

  if (session) {
    if (session.cap_bac === 1) {
      grant = { session, tokens: ['admin'], isAdmin: true };
    } else {
      const chucVuId = await findEmployeeChucVuId(Number(session.employee_id));
      if (chucVuId != null) {
        const tokens = parseQuyenCsv(
          await findQuyenCsvByChucVuAndModule(chucVuId, MODULE_NHAN_VIEN),
        );
        grant = { session, tokens, isAdmin: isModuleAdmin(tokens) };
      }
    }
  }

  grantCache.set(c, grant);
  return grant;
}

/**
 * Có token module thật hay không — KHÔNG có bypass own-row/self.
 * Dùng cho phân quyền theo trường: `assertNhanVienPermission` đã cho `isSelf`
 * qua cổng route, nên tầng trường phải hỏi lại "có `sua` thật không?".
 */
export async function hasNhanVienModuleAction(
  c: Context,
  action: ModuleAction,
): Promise<boolean> {
  const grant = await loadGrant(c);
  if (!grant) return false;
  return grant.isAdmin || grant.tokens.includes(action);
}

/** Super toàn hệ thống hoặc quản trị riêng module Nhân viên. */
export async function isNhanVienAdmin(c: Context): Promise<boolean> {
  const grant = await loadGrant(c);
  return grant?.isAdmin ?? false;
}

/**
 * Server-side matrix check for Nhân viên.
 * Super: cap_bac === 1. Else CSV tokens on var_phan_quyen for employee's position.
 * Own-row: view/edit allowed when nguoi_tao matches (delete still needs xoa).
 */
export async function assertNhanVienPermission(
  c: Context,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null; recordId?: string },
): Promise<Response | null> {
  const session = c.get('session') as JwtPayload | undefined;
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const grant = await loadGrant(c);
  if (!grant) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  const { tokens, isAdmin } = grant;
  if (isAdmin) return null;

  if (tokens.includes(action)) return null;

  const isOwn =
    opts?.recordNguoiTao != null &&
    opts.recordNguoiTao === session.employee_id;
  const isSelf = opts?.recordId != null && opts.recordId === session.employee_id;

  if ((action === 'xem' || action === 'sua') && (isOwn || isSelf)) {
    return null;
  }

  return c.json({ error: 'Forbidden' }, 403);
}
