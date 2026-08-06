/**
 * Standard 4-column signature footer for A4 documents.
 *
 * Dựng bằng `<table>` chứ không phải flexbox: engine HTML của MS Word không hỗ trợ
 * flexbox, trước đây 4 ô ký bị xếp dọc và thừa ~200mm trắng trong file .doc.
 */
import { PRINT_FONT_SIGN_PT, PRINT_INK_MUTED_HEX, PRINT_SIGN_SPACE_MM } from './constants';

export interface SignatureFooterLabels {
  preparer: string;
  reviewer: string;
  related: string;
  approver: string;
  hint: string;
}

export interface SignatureFooterRole {
  key: string;
  title: string;
  hint: string;
}

const SIGN_CELL_STYLE = `width:25%;vertical-align:top;text-align:center;font-size:${PRINT_FONT_SIGN_PT}pt;line-height:1.45;padding:0 4px`;
const SIGN_TITLE_STYLE = 'font-weight:700;margin:0;text-transform:uppercase;white-space:nowrap';
const SIGN_HINT_STYLE = `font-size:8pt;color:${PRINT_INK_MUTED_HEX};margin:2px 0 0 0`;
const SIGN_SPACE_STYLE = `height:${PRINT_SIGN_SPACE_MM}mm`;

function signCellHtml(title: string, hint: string): string {
  return `<td class="epdoc-sign-box" style="${SIGN_CELL_STYLE}">
  <p class="epdoc-sign-box-title" style="${SIGN_TITLE_STYLE}">${title}</p>
  <p class="epdoc-sign-box-hint" style="${SIGN_HINT_STYLE}">${hint}</p>
  <div class="epdoc-sign-space" style="${SIGN_SPACE_STYLE}" aria-hidden="true"></div>
</td>`;
}

/** Inline HTML for Word / static export */
export function buildSignatureFooterHTML(labels: SignatureFooterLabels): string {
  return `<table class="epdoc-sign-footer" style="width:100%;border-collapse:collapse;margin-top:18pt;page-break-inside:avoid"><tbody><tr>
  ${signCellHtml(labels.preparer, labels.hint)}
  ${signCellHtml(labels.reviewer, labels.hint)}
  ${signCellHtml(labels.related, labels.hint)}
  ${signCellHtml(labels.approver, labels.hint)}
</tr></tbody></table>`;
}

/** React-friendly label list for preview component */
export function getSignatureFooterRoles(labels: SignatureFooterLabels): SignatureFooterRole[] {
  return [
    { key: 'preparer', title: labels.preparer, hint: labels.hint },
    { key: 'reviewer', title: labels.reviewer, hint: labels.hint },
    { key: 'related', title: labels.related, hint: labels.hint },
    { key: 'approver', title: labels.approver, hint: labels.hint },
  ];
}
