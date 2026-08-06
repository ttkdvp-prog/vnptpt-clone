import { buildSansStackCss } from '@/lib/theme/fonts';
import {
  PRINT_CONTENT_PADDING_CSS,
  PRINT_FONT_BODY_PT,
  PRINT_FONT_COMPANY_META_PT,
  PRINT_FONT_COMPANY_PT,
  PRINT_FONT_FOOTER_PT,
  PRINT_FONT_NAME_PT,
  PRINT_FONT_SECTION_HEADER_PT,
  PRINT_FONT_SIGN_PT,
  PRINT_FONT_TITLE_PT,
  PRINT_HAIRLINE_HEX,
  PRINT_INK_FAINT_HEX,
  PRINT_INK_HEX,
  PRINT_INK_MUTED_HEX,
  PRINT_LABEL_BG_HEX,
  PRINT_LINE_HEIGHT,
  PRINT_MARGIN_MM,
  PRINT_PHOTO_H_MM,
  PRINT_PHOTO_W_MM,
  PRINT_PRIMARY_DARK_HEX,
  PRINT_PRIMARY_HEX,
  PRINT_PRIMARY_SOFT_HEX,
  PRINT_SIGN_SPACE_MM,
} from './constants';

/** Default font stack when document is built outside browser (Word / server render). */
export const PRINT_DEFAULT_FONT_STACK = buildSansStackCss('Inter');

export interface PrintStylesOptions {
  /** Font stack CSS value; defaults to Inter stack for offline HTML */
  fontStack?: string;
  /** Include @page rules (for print / PDF / Word) */
  includePage?: boolean;
}

/**
 * Stylesheet dùng chung cho tài liệu A4 (hồ sơ nhân viên …).
 * Dùng ở 3 chỗ: inject vào trang preview, `<head>` của HTML render PDF ở server, và Word export.
 *
 * QUY TẮC BẤT BIẾN cho mọi markup dùng stylesheet này:
 * - Chỉ dùng class `epdoc-*`, KHÔNG dùng class màu/alpha của Tailwind trong vùng tài liệu.
 *   Palette mặc định của Tailwind v4 là `oklch()` và modifier alpha (`/80`) sinh
 *   `color-mix(in oklab, …)` — cả hai đều làm html2canvas throw, và token semantic
 *   (`bg-card`, `bg-primary`) còn đảo màu ở theme tối nên sẽ in ra tờ giấy nền đen.
 * - Trong `@media print` KHÔNG bao giờ khai lại `width: 210mm`: bề rộng nội dung do
 *   `@page` margin quyết định, khai thêm 210mm là tràn ra ngoài vùng in và cắt mép phải.
 */
export function buildPrintDocumentCSS(options: PrintStylesOptions = {}): string {
  const fontStack = options.fontStack ?? PRINT_DEFAULT_FONT_STACK;
  const pageRule = options.includePage
    ? `@page {
  size: A4;
  margin: ${PRINT_MARGIN_MM.top}mm ${PRINT_MARGIN_MM.right}mm ${PRINT_MARGIN_MM.bottom}mm ${PRINT_MARGIN_MM.left}mm;
}
`
    : '';

  return `${pageRule}.epdoc-root {
  font-family: ${fontStack};
  font-size: ${PRINT_FONT_BODY_PT}pt;
  line-height: ${PRINT_LINE_HEIGHT};
  color: ${PRINT_INK_HEX};
  background: #ffffff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.epdoc-sheet {
  padding: ${PRINT_CONTENT_PADDING_CSS};
}
.epdoc-root * {
  box-sizing: border-box;
}

/* ---------- Letterhead (table, không flex — Word không hỗ trợ flexbox) ---------- */
.epdoc-letterhead {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 10px 0;
}
.epdoc-letterhead td {
  padding: 0;
}
/* Logo + thông tin công ty canh giữa theo chiều dọc so với ô ảnh 3×4 (cao 40mm),
   nếu canh top sẽ hở một khoảng trắng lớn dưới khối công ty. */
.epdoc-letterhead-logo {
  width: 64px;
  vertical-align: middle;
}
.epdoc-header-logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
}
.epdoc-letterhead-info {
  vertical-align: middle;
  padding-left: 10px !important;
}
.epdoc-letterhead-photo {
  width: ${PRINT_PHOTO_W_MM}mm;
  vertical-align: top;
}
.epdoc-company-name {
  font-size: ${PRINT_FONT_COMPANY_PT}pt;
  font-weight: 700;
  color: ${PRINT_INK_HEX};
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin: 0;
}
.epdoc-company-meta {
  font-size: ${PRINT_FONT_COMPANY_META_PT}pt;
  color: ${PRINT_INK_MUTED_HEX};
  margin: 2px 0 0 0;
}
.epdoc-photo {
  width: ${PRINT_PHOTO_W_MM}mm;
  height: ${PRINT_PHOTO_H_MM}mm;
  object-fit: cover;
  border: 1px solid ${PRINT_HAIRLINE_HEX};
}
.epdoc-photo-placeholder {
  width: ${PRINT_PHOTO_W_MM}mm;
  height: ${PRINT_PHOTO_H_MM}mm;
  margin-left: auto;
  border: 1px dashed ${PRINT_HAIRLINE_HEX};
  color: ${PRINT_INK_FAINT_HEX};
  font-size: 7pt;
  text-align: center;
  line-height: ${PRINT_PHOTO_H_MM}mm;
}

/* ---------- Tiêu đề & khối định danh ---------- */
.epdoc-title {
  font-size: ${PRINT_FONT_TITLE_PT}pt;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 4px 0 8px 0;
  padding-top: 8px;
  border-top: 2px solid ${PRINT_INK_HEX};
}
.epdoc-heading {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 4px 0;
}
.epdoc-heading td {
  padding: 0;
  vertical-align: bottom;
}
.epdoc-heading-name {
  font-size: ${PRINT_FONT_NAME_PT}pt;
  font-weight: 700;
  color: ${PRINT_INK_HEX};
}
.epdoc-heading-code {
  text-align: right;
  font-size: ${PRINT_FONT_BODY_PT}pt;
  color: ${PRINT_INK_MUTED_HEX};
  white-space: nowrap;
}
.epdoc-heading-role {
  font-size: ${PRINT_FONT_BODY_PT}pt;
  color: ${PRINT_INK_MUTED_HEX};
  padding-top: 2px !important;
}

/* ---------- Section: thanh tiêu đề + lưới 2 cột ---------- */
.epdoc-section {
  margin-top: 10px;
}
.epdoc-section-bar {
  background: ${PRINT_PRIMARY_SOFT_HEX};
  color: ${PRINT_PRIMARY_DARK_HEX};
  border-left: 3px solid ${PRINT_PRIMARY_HEX};
  padding: 3px 6px;
  font-size: ${PRINT_FONT_SECTION_HEADER_PT}pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  break-after: avoid;
  page-break-after: avoid;
}
.epdoc-fields {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.epdoc-fields tr {
  break-inside: avoid;
  page-break-inside: avoid;
}
.epdoc-fields td {
  border: 1px solid ${PRINT_HAIRLINE_HEX};
  padding: 3px 6px;
  vertical-align: top;
  font-size: ${PRINT_FONT_BODY_PT}pt;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.epdoc-label {
  width: 22%;
  background: ${PRINT_LABEL_BG_HEX};
  color: ${PRINT_INK_MUTED_HEX};
  font-weight: 600;
}
.epdoc-value {
  width: 28%;
  color: ${PRINT_INK_HEX};
}

/* ---------- Chữ ký & chân trang ---------- */
.epdoc-sign-footer {
  width: 100%;
  border-collapse: collapse;
  margin-top: 18pt;
  break-inside: avoid;
  page-break-inside: avoid;
}
.epdoc-sign-box {
  width: 25%;
  vertical-align: top;
  text-align: center;
  font-size: ${PRINT_FONT_SIGN_PT}pt;
  line-height: ${PRINT_LINE_HEIGHT};
  padding: 0 4px;
}
.epdoc-sign-box-title {
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  white-space: nowrap;
}
.epdoc-sign-box-hint {
  font-size: 8pt;
  color: ${PRINT_INK_MUTED_HEX};
  margin: 2px 0 0 0;
}
.epdoc-sign-space {
  height: ${PRINT_SIGN_SPACE_MM}mm;
}
.epdoc-printed-at {
  font-size: ${PRINT_FONT_FOOTER_PT}pt;
  color: ${PRINT_INK_FAINT_HEX};
  margin-top: 12px;
}
.epdoc-divider {
  border: 0;
  border-top: 1px solid ${PRINT_HAIRLINE_HEX};
  margin: 10px 0;
}
@media print {
  .epdoc-sheet {
    padding: 0 !important;
    box-shadow: none !important;
  }
}`;
}

/** Screen-only padding on preview (mirrors @page content area inside 210mm sheet) */
export const PRINT_PREVIEW_PADDING_CLASS = 'pt-[15mm] pr-[15mm] pb-[15mm] pl-[20mm]';

export function getPrintContentPaddingStyle(): string {
  return PRINT_CONTENT_PADDING_CSS;
}
