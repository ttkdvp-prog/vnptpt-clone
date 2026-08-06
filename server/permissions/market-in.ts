import type { Context } from 'hono';
import {
  assertModulePermission,
  type ModuleAction,
} from '@/server/permissions/assert-module';

/** DB module_key — khớp `lib/permission-db-keys.ts`. */
const MODULE_DANH_SACH_MARKET_IN = 'danh_sach_market_in';

export async function assertMarketInPermission(
  c: Context,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null },
): Promise<Response | null> {
  return assertModulePermission(c, MODULE_DANH_SACH_MARKET_IN, action, {
    recordNguoiTao: opts?.recordNguoiTao,
    allowOwnRow: true,
  });
}
