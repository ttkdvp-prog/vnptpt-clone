import type { Context } from 'hono';
import {
  assertModulePermission,
  getSessionIsSuperOrModuleAdmin,
  type ModuleAction,
} from '@/server/permissions/assert-module';

/** DB module_key — khớp `lib/permission-db-keys.ts`. */
const MODULE_PHIEU_HANH_CHINH = 'phieu_hanh_chinh';

export async function assertPhieuHanhChinhPermission(
  c: Context,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null },
): Promise<Response | null> {
  return assertModulePermission(c, MODULE_PHIEU_HANH_CHINH, action, {
    recordNguoiTao: opts?.recordNguoiTao,
    allowOwnRow: true,
  });
}

/** Quyền đặc biệt cho phép sửa/xóa phiếu đã chuyển HCNS hoặc đã duyệt. */
export async function canManageLockedPhieuHanhChinh(
  c: Context,
): Promise<boolean> {
  return getSessionIsSuperOrModuleAdmin(c, MODULE_PHIEU_HANH_CHINH);
}
