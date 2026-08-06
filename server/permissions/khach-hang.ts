import type { Context } from 'hono';
import {
  assertModulePermission,
  type ModuleAction,
} from '@/server/permissions/assert-module';

/** DB module_key — khớp `lib/permission-db-keys.ts`. */
const MODULE_DANH_SACH_KHACH_HANG = 'danh_sach_khach_hang';

export async function assertKhachHangPermission(
  c: Context,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null },
): Promise<Response | null> {
  return assertModulePermission(c, MODULE_DANH_SACH_KHACH_HANG, action, {
    recordNguoiTao: opts?.recordNguoiTao,
    allowOwnRow: true,
  });
}
