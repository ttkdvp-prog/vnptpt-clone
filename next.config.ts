import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * Cho phép chạy instance dev thứ hai song song (vd. phiên review/agent khác):
   * NEXT_DIST_DIR=.next-review next dev -p 5599 — mỗi distDir có lock `dev` riêng.
   * Không set env → giữ nguyên `.next` mặc định.
   */
  distDir: process.env.NEXT_DIST_DIR || undefined,
  /**
   * `@sparticuz/chromium` + `puppeteer-core` nạp binary Chromium bằng đường dẫn runtime
   * (không phải import tĩnh) — bundle chúng vào server chunk sẽ làm hỏng trace binary.
   * `docx` để ngoài cho nhẹ bundle. Vercel tự nhận diện các package này qua
   * `serverExternalPackages`/Next tracing, không cần `output: 'standalone'` như VPS Docker.
   */
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core', 'docx'],
};

export default nextConfig;
