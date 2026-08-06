import type { Context } from 'hono';
import type { JwtPayload } from '@/server/auth';
import { parseQuyenCsv } from '@/lib/permission-db-keys';
import { findEmployeeChucVuId } from '@/server/repositories/nhan-vien';
import { findQuyenCsvByChucVuAndModule } from '@/server/repositories/phan-quyen';

export type ModuleAction = 'xem' | 'them' | 'sua' | 'xoa';

async function loadGrantTokens(
  c: Context,
  moduleKey: string,
): Promise<{ session: JwtPayload; tokens: string[] } | Response> {
  const session = c.get('session') as JwtPayload | undefined;
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (session.cap_bac === 1) {
    return { session, tokens: ['admin'] };
  }

  const chucVuId = await findEmployeeChucVuId(Number(session.employee_id));
  if (chucVuId == null) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const quyen = await findQuyenCsvByChucVuAndModule(chucVuId, moduleKey);
  return { session, tokens: parseQuyenCsv(quyen) };
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

  if (session.cap_bac === 1 || isModuleAdmin(tokens)) return null;
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

  if (session.cap_bac === 1 || isModuleAdmin(tokens)) return null;
  if (actions.some((a) => tokens.includes(a))) return null;

  return c.json({ error: 'Forbidden' }, 403);
}

export async function getSessionIsSuper(c: Context): Promise<boolean> {
  const session = c.get('session') as JwtPayload | undefined;
  return session?.cap_bac === 1;
}

/** Super toàn hệ thống hoặc quản trị riêng module. */
export async function getSessionIsSuperOrModuleAdmin(
  c: Context,
  moduleKey: string,
): Promise<boolean> {
  const loaded = await loadGrantTokens(c, moduleKey);
  if (loaded instanceof Response) return false;
  return loaded.session.cap_bac === 1 || isModuleAdmin(loaded.tokens);
}
