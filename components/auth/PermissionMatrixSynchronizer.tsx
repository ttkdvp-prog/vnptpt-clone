import { useHydratePositionPermissions } from '@/hooks/use-hydrate-position-permissions';

/** Hydrate quyền theo chức vụ sau đăng nhập khi `NEXT_PUBLIC_USE_PERMISSION_MATRIX=true`. */
export function PermissionMatrixSynchronizer() {
  useHydratePositionPermissions();
  return null;
}
