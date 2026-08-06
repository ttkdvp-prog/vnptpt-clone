import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';

const MODULE_ID = 'hanh-chinh/phieu-hanh-chinh';

/**
 * Cấp bậc 1 hoặc quản trị module — được sửa/xóa phiếu đã chuyển HCNS
 * và phiếu đã duyệt.
 */
export function useCanManageLockedPhieuHanhChinh(): boolean {
  const positionCapBac = usePermissionGrantStore((state) => state.positionCapBac);
  const grantsByModule = usePermissionGrantStore((state) => state.grantsByModule);
  const grants = grantsByModule[MODULE_ID] ?? [];

  return (
    positionCapBac === 1 ||
    grants.includes('admin') ||
    grants.includes('all')
  );
}
