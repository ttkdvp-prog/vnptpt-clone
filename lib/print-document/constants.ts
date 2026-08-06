/** A4 print layout — single source of truth for document exports. */

/** Page margins in mm: left 2cm, right/top/bottom 1.5cm */
export const PRINT_MARGIN_MM = {
  top: 15,
  right: 15,
  bottom: 15,
  left: 20,
} as const;

export const PRINT_PAGE_SIZE = 'A4' as const;

export const PRINT_LINE_HEIGHT = 1.45;

export const PRINT_FONT_BODY_PT = 10;
export const PRINT_FONT_TITLE_PT = 16;
export const PRINT_FONT_COMPANY_PT = 14;
export const PRINT_FONT_COMPANY_META_PT = 9;
export const PRINT_FONT_SECTION_HEADER_PT = 9;
export const PRINT_FONT_FOOTER_PT = 7;
export const PRINT_FONT_NAME_PT = 14;
export const PRINT_FONT_SIGN_PT = 8.5;

/**
 * Màu nhấn của **tài liệu in** — cố định, KHÔNG bám `primaryColor` người dùng chọn.
 * PDF / .docx render ở server nên server không biết theme UI của từng người; giữ cố định
 * để preview = in = PDF = Word luôn khớp. Đổi ở đây là đổi cả 4 kênh.
 */
export const PRINT_PRIMARY_HEX = '#3b82f6';
/** Nền nhạt của thanh tiêu đề section — đỡ mực in hơn dải màu đặc */
export const PRINT_PRIMARY_SOFT_HEX = '#eff6ff';
/** Chữ tiêu đề section trên nền nhạt */
export const PRINT_PRIMARY_DARK_HEX = '#1d4ed8';

/** Màu mực & đường kẻ (hex — vùng in không được dùng oklch / color-mix) */
export const PRINT_INK_HEX = '#1f2937';
export const PRINT_INK_MUTED_HEX = '#4b5563';
export const PRINT_INK_FAINT_HEX = '#6b7280';
export const PRINT_HAIRLINE_HEX = '#d7dae0';
export const PRINT_LABEL_BG_HEX = '#f7f8fa';

/** Ảnh chân dung 3×4 (mm) */
export const PRINT_PHOTO_W_MM = 30;
export const PRINT_PHOTO_H_MM = 40;

/** Khoảng chừa để ký (mm) — 4 cột ~43mm nên giữ thấp để khối chữ ký không chiếm cả trang */
export const PRINT_SIGN_SPACE_MM = 25;

/** CSS padding matching print margins for on-screen preview */
export const PRINT_CONTENT_PADDING_CSS = '15mm 15mm 15mm 20mm';

/** jsPDF html() margin array: [top, right, bottom, left] — còn dùng cho PDF hợp đồng */
export const PRINT_MARGIN_JSPDF: [number, number, number, number] = [
  PRINT_MARGIN_MM.top,
  PRINT_MARGIN_MM.right,
  PRINT_MARGIN_MM.bottom,
  PRINT_MARGIN_MM.left,
];
