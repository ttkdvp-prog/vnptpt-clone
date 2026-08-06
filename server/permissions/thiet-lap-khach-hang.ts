import type { Context } from 'hono';
import {
  assertModulePermission,
  type ModuleAction,
} from '@/server/permissions/assert-module';

/** DB module_key — khớp `lib/permission-db-keys.ts`. */
const MODULE_THIET_LAP_KHACH_HANG = 'thiet_lap_khach_hang';

export async function assertThietLapKhachHangPermission(
  c: Context,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null },
): Promise<Response | null> {
  return assertModulePermission(c, MODULE_THIET_LAP_KHACH_HANG, action, {
    recordNguoiTao: opts?.recordNguoiTao,
    allowOwnRow: true,
  });
}
