/**
 * Puppeteer tự đọc file này lúc `npm install`/`npm ci` (qua lilconfig), bất kể
 * build bằng gì (Dockerfile, Nixpacks tự sinh, hay chạy local) — khác với biến
 * môi trường `PUPPETEER_SKIP_DOWNLOAD` trong Dockerfile chỉ có tác dụng khi
 * đúng Dockerfile đó thực sự chạy `npm ci`. Runtime container tự cài Chromium
 * hệ thống qua `apk add chromium` + trỏ `PUPPETEER_EXECUTABLE_PATH` (xem
 * Dockerfile, lib/pdf/render-html-to-pdf.ts) nên không cần bản Chrome riêng
 * của puppeteer — bỏ qua tải để install không phụ thuộc mạng/zip archiver.
 */
module.exports = {
  skipDownload: true,
};
