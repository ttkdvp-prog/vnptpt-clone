import type { Context } from 'hono';
import { assertModulePermissionAny } from '@/server/permissions/assert-module';

const MODULE_CONG_TY = 'thong_tin_cong_ty';

/**
 * GET: xem | sua | admin | super
 * PATCH: sua | admin | super
 */
export async function assertCongTyPermission(
  c: Context,
  action: 'xem' | 'sua',
): Promise<Response | null> {
  if (action === 'xem') {
    return assertModulePermissionAny(c, MODULE_CONG_TY, ['xem', 'sua']);
  }
  return assertModulePermissionAny(c, MODULE_CONG_TY, ['sua']);
}
