/** Tên file an toàn cho export (dùng chung hồ sơ nhân viên / hợp đồng / phiếu). */
export function safeFileName(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[<>:"/\\|?*]/g, '');
}
