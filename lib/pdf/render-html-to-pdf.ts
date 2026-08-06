/**
 * Render HTML → PDF bằng Chromium (server-only).
 *
 * Vì sao render ở server thay vì jsPDF + html2canvas ở client:
 * - html2canvas 1.4.1 không đọc được `oklch()` / `color-mix(in oklab, …)` của Tailwind v4 → throw.
 * - Kể cả khi chạy, jsPDF.html() cho ra PDF dạng ẢNH raster: chữ mờ khi zoom, không tìm
 *   được chữ, file 2–5MB. Chromium cho ra chữ vector, tiếng Việt đúng dấu, file ~100–300KB.
 *
 * Docker (`node:22-alpine`) cần: `apk add chromium nss freetype harfbuzz ca-certificates
 * ttf-freefont font-noto` + `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`.
 * `font-noto` là bắt buộc — thiếu nó tiếng Việt có dấu render thành ô vuông.
 */
import type { Browser } from 'puppeteer';
import { PRINT_MARGIN_MM } from '@/lib/print-document/constants';

const RENDER_TIMEOUT_MS = 30_000;
const BROWSER_IDLE_MS = 60_000;
/** Mỗi lần render Chromium chiếm đỉnh ~300–500MB RAM — chặn để không hạ VPS */
const MAX_CONCURRENT_RENDERS = 2;

let browserPromise: Promise<Browser> | null = null;
let idleTimer: NodeJS.Timeout | null = null;
let activeRenders = 0;
const waitQueue: (() => void)[] = [];

async function acquireSlot(): Promise<void> {
  if (activeRenders < MAX_CONCURRENT_RENDERS) {
    activeRenders += 1;
    return;
  }
  await new Promise<void>((resolve) => waitQueue.push(resolve));
  activeRenders += 1;
}

function releaseSlot(): void {
  activeRenders -= 1;
  const next = waitQueue.shift();
  if (next) next();
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = (async () => {
      const puppeteer = await import('puppeteer');
      return puppeteer.default.launch({
        headless: true,
        // container chạy user không phải root nên không có sandbox namespace
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });
    })().catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

function scheduleIdleClose(): void {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    idleTimer = null;
    if (activeRenders > 0) return;
    const pending = browserPromise;
    browserPromise = null;
    void pending?.then((b) => b.close()).catch(() => {});
  }, BROWSER_IDLE_MS);
  idleTimer.unref?.();
}

export interface RenderPdfOptions {
  /**
   * Dòng tiêu đề chạy lặp lại ở đầu MỌI trang (kể cả trang 1) — vd. "HỒ SƠ NHÂN SỰ · Tên · Mã NV".
   * Đây là cách duy nhất có header lặp thật trên PDF nhiều trang: CSS Paged Media
   * (`@page { @top-left { … } }`) không được Chromium hỗ trợ, và tự dựng `<thead>` lặp lại
   * trong chính HTML tài liệu không đáng tin — nội dung nằm trong ô bảng khiến Chrome ngắt
   * trang sai chỗ (đã gặp lỗi này khi thử ở bước làm cơ chế in). `headerTemplate` của Puppeteer
   * render độc lập với luồng nội dung nên không có rủi ro đó, đổi lại là lặp cả ở trang 1
   * (chấp nhận được — nhiều mẫu văn bản hành chính vẫn có dải này song song với tiêu đề lớn).
   */
  headerText?: string;
  /** Nhãn số trang, mặc định "Trang" */
  pageLabel?: string;
}

/**
 * Puppeteer render header/footer template trong context riêng, KHÔNG thấy `<style>` của trang
 * — @font-face nhúng base64 cho nội dung chính không áp dụng ở đây. Một dòng 7pt không đáng
 * đổi thêm base64 riêng cho vùng này; chỉ ép sans-serif để không lệch tông với phần thân Inter.
 */
const HEADER_FOOTER_FONT = "font-family: Helvetica, Arial, sans-serif;";

function buildHeaderTemplate(opts: RenderPdfOptions): string {
  if (!opts.headerText) return '<span></span>';
  const text = opts.headerText.replace(/</g, '&lt;');
  return `<div style="width:100%;font-size:7pt;color:#6b7280;${HEADER_FOOTER_FONT}padding:0 ${PRINT_MARGIN_MM.right}mm 2px ${PRINT_MARGIN_MM.left}mm;border-bottom:1px solid #e5e7eb;">${text}</div>`;
}

function buildFooterTemplate(opts: RenderPdfOptions): string {
  const label = opts.pageLabel ?? 'Trang';
  return `<div style="width:100%;font-size:7pt;color:#6b7280;${HEADER_FOOTER_FONT}padding:0 ${PRINT_MARGIN_MM.right}mm 0 ${PRINT_MARGIN_MM.left}mm;text-align:right;">
  ${label} <span class="pageNumber"></span>/<span class="totalPages"></span>
</div>`;
}

/**
 * Số trang "Trang x/y" chỉ làm được qua `footerTemplate` của Puppeteer —
 * `@page { @bottom-right { content: counter(page) } }` Chrome chưa hỗ trợ.
 */
export async function renderHtmlToPdf(
  html: string,
  opts: RenderPdfOptions = {},
): Promise<Buffer> {
  await acquireSlot();
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);
    // setContent thay vì goto: không phải bơm cookie/JWT của người dùng vào Chromium.
    // `load` đủ vì ảnh đã được nhúng data URL trước khi dựng HTML.
    await page.setContent(html, { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS });
    await page.evaluateHandle('document.fonts.ready');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: buildHeaderTemplate(opts),
      footerTemplate: buildFooterTemplate(opts),
      margin: {
        top: `${PRINT_MARGIN_MM.top}mm`,
        right: `${PRINT_MARGIN_MM.right}mm`,
        bottom: `${PRINT_MARGIN_MM.bottom}mm`,
        left: `${PRINT_MARGIN_MM.left}mm`,
      },
      timeout: RENDER_TIMEOUT_MS,
    });

    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
    releaseSlot();
    scheduleIdleClose();
  }
}
