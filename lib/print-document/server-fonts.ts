/**
 * Nhúng Inter (base64) cho HTML render ở server (PDF qua Chromium headless).
 *
 * Preview trên trình duyệt tải Inter qua `<link>` Google Fonts trong `app/layout.tsx`.
 * Chromium headless trong container KHÔNG có mạng đảm bảo và KHÔNG có Inter cài sẵn ở hệ
 * điều hành, nên nếu không nhúng, PDF sẽ rơi về font hệ thống (Noto Sans/Helvetica) — khác
 * preview. Nhúng thẳng base64 để không phụ thuộc mạng lúc render và ra đúng font Inter.
 *
 * Chỉ lấy 2 subset cần dùng — latin (chữ số, dấu câu, bảng chữ cái cơ bản) và vietnamese
 * (nguyên âm có dấu) — ở 2 độ đậm 400/700 đang dùng trong tài liệu. File nguồn:
 * `assets/fonts/inter/` (tải từ Google Fonts CSS2 API, giấy phép SIL OFL).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const FONT_DIR = path.join(process.cwd(), 'assets/fonts/inter');

const LATIN_RANGE =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const VIETNAMESE_RANGE =
  'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB';

let cachedCss: Promise<string> | null = null;

async function readAsBase64(fileName: string): Promise<string> {
  const buffer = await readFile(path.join(FONT_DIR, fileName));
  return buffer.toString('base64');
}

function fontFace(weight: 400 | 700, base64: string, unicodeRange: string): string {
  return `@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: ${weight};
  font-display: block;
  src: url(data:font/woff2;base64,${base64}) format('woff2');
  unicode-range: ${unicodeRange};
}`;
}

/** `@font-face` CSS nhúng sẵn — cache trong bộ nhớ process, chỉ đọc đĩa một lần. */
export async function buildEmbeddedInterFontFaceCSS(): Promise<string> {
  if (!cachedCss) {
    cachedCss = (async () => {
      const [latin400, latin700, viet400, viet700] = await Promise.all([
        readAsBase64('Inter-latin-400.woff2'),
        readAsBase64('Inter-latin-700.woff2'),
        readAsBase64('Inter-vietnamese-400.woff2'),
        readAsBase64('Inter-vietnamese-700.woff2'),
      ]);
      return [
        fontFace(400, latin400, LATIN_RANGE),
        fontFace(700, latin700, LATIN_RANGE),
        fontFace(400, viet400, VIETNAMESE_RANGE),
        fontFace(700, viet700, VIETNAMESE_RANGE),
      ].join('\n');
    })().catch((err) => {
      cachedCss = null;
      throw err;
    });
  }
  return cachedCss;
}
