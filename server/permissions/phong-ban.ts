import type { Context } from 'hono';
import {
  assertModulePermission,
  type ModuleAction,
} from '@/server/permissions/assert-module';

const MODULE_PHONG_BAN = 'phong_ban';

/**
 * Server-side matrix check for Phòng ban.
 * Super: cap_bac === 1. Own-row: view/edit when nguoi_tao matches.
 */
export async function assertPhongBanPermission(
  c: Context,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null },
): Promise<Response | null> {
  return assertModulePermission(c, MODULE_PHONG_BAN, action, {
    recordNguoiTao: opts?.recordNguoiTao,
    allowOwnRow: true,
  });
}
