import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  /**
   * Cho phép chạy instance dev thứ hai song song (vd. phiên review/agent khác):
   * NEXT_DIST_DIR=.next-review next dev -p 5599 — mỗi distDir có lock `dev` riêng.
   * Không set env → giữ nguyên `.next` mặc định.
   */
  distDir: process.env.NEXT_DIST_DIR || undefined,
  /**
   * Bắt buộc với `output: 'standalone'`: puppeteer nạp Chromium bằng đường dẫn runtime,
   * bundle nó vào server chunk sẽ làm hỏng trace binary. `docx` để ngoài cho nhẹ bundle.
   */
  serverExternalPackages: ['puppeteer', 'docx'],
};

export default nextConfig;
