import type { Context } from 'hono';
import {
  assertModulePermission,
  type ModuleAction,
} from '@/server/permissions/assert-module';
import { parseQuyenCsv } from '@/lib/permission-db-keys';
import { findEmployeeChucVuId } from '@/server/repositories/nhan-vien';
import { findQuyenCsvByChucVuAndModule } from '@/server/repositories/phan-quyen';
import type { JwtPayload } from '@/server/auth';

/** DB module_key — khớp `lib/permission-db-keys.ts`. */
const MODULE_THONG_BAO = 'thong_bao';

export async function assertThongBaoPermission(
  c: Context,
  action: ModuleAction,
  opts?: { recordNguoiTao?: string | null },
): Promise<Response | null> {
  return assertModulePermission(c, MODULE_THONG_BAO, action, {
    recordNguoiTao: opts?.recordNguoiTao,
    allowOwnRow: true,
  });
}

export interface ThongBaoViewer {
  bypassAcl: boolean;
  employeeId: number | null;
  chucVuId: number | null;
}

/** Super / module admin bỏ qua ACL chức vụ; còn lại lọc theo id_chuc_vu / người tạo. */
export async function resolveThongBaoViewer(c: Context): Promise<ThongBaoViewer> {
  const session = c.get('session') as JwtPayload | undefined;
  const employeeId =
    session?.employee_id != null && session.employee_id !== ''
      ? Number(session.employee_id)
      : null;
  const empId = employeeId != null && Number.isFinite(employeeId) ? employeeId : null;

  if (session?.cap_bac === 1) {
    return { bypassAcl: true, employeeId: empId, chucVuId: null };
  }

  const chucVuId = empId != null ? await findEmployeeChucVuId(empId) : null;
  const quyen =
    chucVuId != null
      ? await findQuyenCsvByChucVuAndModule(chucVuId, MODULE_THONG_BAO)
      : '';
  const tokens = parseQuyenCsv(quyen);
  const bypassAcl =
    tokens.includes('admin') || tokens.includes('tat_ca') || tokens.includes('all');

  return { bypassAcl, employeeId: empId, chucVuId };
}
