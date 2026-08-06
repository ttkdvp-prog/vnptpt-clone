import type { Context } from 'hono';
import { assertModulePermissionAny } from '@/server/permissions/assert-module';

const MODULE_PHAN_QUYEN = 'phan_quyen';

/**
 * GET: xem | sua | admin | super
 * PUT: sua | admin | super (not them/xoa alone)
 */
export async function assertPhanQuyenPermission(
  c: Context,
  action: 'xem' | 'sua',
): Promise<Response | null> {
  if (action === 'xem') {
    return assertModulePermissionAny(c, MODULE_PHAN_QUYEN, ['xem', 'sua']);
  }
  return assertModulePermissionAny(c, MODULE_PHAN_QUYEN, ['sua']);
}
