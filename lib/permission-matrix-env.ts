/** Bật ma trận quyền theo chức vụ (hydrate từ `var_phan_quyen`). Opt-out: `NEXT_PUBLIC_USE_PERMISSION_MATRIX=false`. */
export function isPermissionMatrixEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_PERMISSION_MATRIX !== 'false';
}
