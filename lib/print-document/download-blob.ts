/**
 * Tải Blob về máy.
 * Hai chi tiết quan trọng: `<a>` phải nằm trong DOM (Firefox/Safari), và KHÔNG được
 * `revokeObjectURL` đồng bộ ngay sau `click()` — sẽ huỷ lượt tải đang bắt đầu.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
