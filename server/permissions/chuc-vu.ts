import type { Context } from 'hono';
import {
  assertModulePermission,
  type ModuleAction,
} from '@/server/permissions/assert-module';

const MODULE_CHUC_VU = 'chuc_vu';

/**
 * Server-side matrix check for Chức vụ.
 * Super: cap_bac === 1. Own-row: view/edit when nguoi_tao matches.
 */
export async function assertChucVuPermission(
  c: Context,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null },
): Promise<Response | null> {
  return assertModulePermission(c, MODULE_CHUC_VU, action, {
    recordNguoiTao: opts?.recordNguoiTao,
    allowOwnRow: true,
  });
}
