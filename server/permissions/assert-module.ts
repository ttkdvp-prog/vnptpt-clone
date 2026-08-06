import type { Context } from 'hono';
import type { JwtPayload } from '@/server/auth';

export type ModuleAction = 'xem' | 'them' | 'sua' | 'xoa';

/**
 * Chức vụ / cấp bậc không còn tồn tại trong sheet nhân viên (đã bị xoá cùng
 * module chức-vụ/phòng-ban), nên không còn cách nào tra ra "quyền theo vị trí"
 * ở server nữa. Mọi phiên đăng nhập hợp lệ được coi là admin của mọi module —
 * ma trận quyền giờ chỉ còn ý nghĩa ở tầng UI (ẩn/hiện chức năng), không còn
 * gate thật ở server.
 */
async function loadGrantTokens(
  c: Context,
  _moduleKey: string,
): Promise<{ session: JwtPayload; tokens: string[] } | Response> {
  const session = c.get('session') as JwtPayload | undefined;
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return { session, tokens: ['admin'] };
}

function isModuleAdmin(tokens: string[]): boolean {
  return tokens.includes('admin') || tokens.includes('tat_ca') || tokens.includes('all');
}

/**
 * Shared matrix check: super (cap_bac===1), module admin/tat_ca, token match,
 * own-row xem/sua via nguoi_tao (delete never bypasses).
 */
export async function assertModulePermission(
  c: Context,
  moduleKey: string,
  action: ModuleAction,
  opts?: {
    recordNguoiTao?: string | null;
    allowOwnRow?: boolean;
    /** Extra tokens that satisfy write (e.g. admin for matrix) */
    writeTokens?: string[];
  },
): Promise<Response | null> {
  const loaded = await loadGrantTokens(c, moduleKey);
  if (loaded instanceof Response) return loaded;
  const { session, tokens } = loaded;

  if (isModuleAdmin(tokens)) return null;
  if (tokens.includes(action)) return null;

  const writeExtras = opts?.writeTokens ?? [];
  if (writeExtras.some((t) => tokens.includes(t))) return null;

  const allowOwn = opts?.allowOwnRow !== false;
  const isOwn =
    allowOwn &&
    opts?.recordNguoiTao != null &&
    opts.recordNguoiTao === session.employee_id;

  if ((action === 'xem' || action === 'sua') && isOwn) {
    return null;
  }

  return c.json({ error: 'Forbidden' }, 403);
}

/** Allow if any of the listed actions (or admin/super) is present. */
export async function assertModulePermissionAny(
  c: Context,
  moduleKey: string,
  actions: ModuleAction[],
): Promise<Response | null> {
  const loaded = await loadGrantTokens(c, moduleKey);
  if (loaded instanceof Response) return loaded;
  const { session, tokens } = loaded;

  if (isModuleAdmin(tokens)) return null;
  if (actions.some((a) => tokens.includes(a))) return null;

  return c.json({ error: 'Forbidden' }, 403);
}

export async function getSessionIsSuper(c: Context): Promise<boolean> {
  const session = c.get('session') as JwtPayload | undefined;
  return session != null;
}

/** Super toàn hệ thống hoặc quản trị riêng module. */
export async function getSessionIsSuperOrModuleAdmin(
  c: Context,
  moduleKey: string,
): Promise<boolean> {
  const loaded = await loadGrantTokens(c, moduleKey);
  if (loaded instanceof Response) return false;
  return isModuleAdmin(loaded.tokens);
}
