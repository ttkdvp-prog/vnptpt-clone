import type { Context } from 'hono';
import type { JwtPayload } from '@/server/auth';
import type { ModuleAction } from '@/server/permissions/assert-module';

export interface ModuleGrantContext {
  session: JwtPayload;
  tokens: string[];
  isSuper: boolean;
  isModuleAdmin: boolean;
}

/**
 * Nạp quyền MỘT LẦN cho cả lô, để `grantAllowsRow` chỉ còn so sánh trong bộ nhớ.
 * Trả `Response` (401/403) khi không đăng nhập hoặc không tra được chức vụ —
 * gọi ở đầu handler như một guard lô, TRƯỚC khi lặp từng dòng.
 */
export async function resolveModuleGrant(
  c: Context,
  _moduleKey: string,
): Promise<ModuleGrantContext | Response> {
  const session = c.get('session') as JwtPayload | undefined;
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Không còn chức vụ/cấp bậc trên nhân viên ⇒ mọi phiên hợp lệ là admin module.
  return { session, tokens: ['admin'], isSuper: true, isModuleAdmin: true };
}

/**
 * Đánh giá MỘT dòng theo grant đã nạp — không I/O, gọi được trong vòng lặp.
 * Cùng luật với `assertModulePermission` (super/admin qua tất cả; token khớp
 * action qua; own-row cho `xem`/`sua` qua) nhưng trả boolean thay vì Response,
 * vì một dòng không đủ quyền chỉ nên vào `failed[]`, không 403 cả lô.
 */
export function grantAllowsRow(
  grant: ModuleGrantContext,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null; recordId?: string },
): boolean {
  if (grant.isSuper || grant.isModuleAdmin) return true;
  if (grant.tokens.includes(action)) return true;

  const isOwn =
    opts?.recordNguoiTao != null && opts.recordNguoiTao === grant.session.employee_id;
  const isSelf = opts?.recordId != null && opts.recordId === grant.session.employee_id;

  return (action === 'xem' || action === 'sua') && (isOwn || isSelf);
}
