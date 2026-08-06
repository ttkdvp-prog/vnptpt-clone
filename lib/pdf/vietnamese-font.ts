/**
 * Đăng ký font Roboto (hỗ trợ đầy đủ tiếng Việt) cho jsPDF.
 *
 * jsPDF mặc định dùng font chuẩn PDF (helvetica…) chỉ hỗ trợ Latin-1 → chữ Việt vỡ dấu.
 * Gọi hàm này ngay sau khi tạo `doc`, rồi dùng font 'Roboto' cho mọi text/autoTable:
 *
 *   const doc = new jsPDF(…);
 *   await registerVietnameseFont(doc);
 *   doc.setFont('Roboto', 'bold');
 *   autoTable(doc, { styles: { font: 'Roboto' }, headStyles: { font: 'Roboto' }, … });
 *
 * Lưu ý: jspdf-autotable KHÔNG kế thừa font của doc — phải set `font: 'Roboto'`
 * trong cả `styles` lẫn `headStyles`.
 */
import type { jsPDF } from 'jspdf';

export const VIETNAMESE_PDF_FONT = 'Roboto';

export async function registerVietnameseFont(doc: jsPDF): Promise<void> {
  const { ROBOTO_REGULAR_B64, ROBOTO_BOLD_B64 } = await import('./roboto-base64');
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_B64);
  doc.addFont('Roboto-Regular.ttf', VIETNAMESE_PDF_FONT, 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_B64);
  doc.addFont('Roboto-Bold.ttf', VIETNAMESE_PDF_FONT, 'bold');
  doc.setFont(VIETNAMESE_PDF_FONT, 'normal');
}
