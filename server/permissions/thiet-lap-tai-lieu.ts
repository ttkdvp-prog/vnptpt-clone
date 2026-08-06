import type { Context } from 'hono';
import {
  assertModulePermission,
  type ModuleAction,
} from '@/server/permissions/assert-module';

/** DB module_key — khớp `lib/permission-db-keys.ts`. */
const MODULE_THIET_LAP_TAI_LIEU = 'thiet_lap_tai_lieu';

export async function assertThietLapTaiLieuPermission(
  c: Context,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null },
): Promise<Response | null> {
  return assertModulePermission(c, MODULE_THIET_LAP_TAI_LIEU, action, {
    recordNguoiTao: opts?.recordNguoiTao,
    allowOwnRow: true,
  });
}
