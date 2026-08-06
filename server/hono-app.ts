import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { phongBanRoutes } from './routes/phong-ban';
import { chucVuRoutes } from './routes/chuc-vu';
import { nhanVienRoutes } from './routes/nhan-vien';
import { congTyRoutes } from './routes/cong-ty';
import { phanQuyenRoutes } from './routes/phan-quyen';
import { uploadsRoutes } from './routes/uploads';
import { nhomKhachHangRoutes } from './routes/nhom-khach-hang';
import { trangThaiKhachHangRoutes } from './routes/trang-thai-khach-hang';
import { khachHangRoutes } from './routes/khach-hang';
import { nguoiLienHeRoutes } from './routes/nguoi-lien-he';
import { loaiTaiLieuRoutes } from './routes/loai-tai-lieu';
import { marketInRoutes } from './routes/market-in';
import { phieuHanhChinhRoutes } from './routes/phieu-hanh-chinh';
import { danhSachTaiLieuRoutes } from './routes/danh-sach-tai-lieu';
import { hopDongRoutes } from './routes/hop-dong';
import { thongBaoRoutes } from './routes/thong-bao';
import { prisma } from './db';

/** Shared Hono app — served via Next Route Handlers (or optional standalone). */
export function createHonoApp() {
  const app = new Hono();

  const originsRaw =
    process.env.CLIENT_ORIGINS?.trim() ||
    process.env.CLIENT_ORIGIN?.trim() ||
    'http://localhost:3000';
  const originList = originsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const corsOrigin =
    originList.length <= 1
      ? (originList[0] ?? 'http://localhost:3000')
      : (origin: string) => (originList.includes(origin) ? origin : undefined);

  app.use(
    '*',
    cors({
      origin: corsOrigin,
      credentials: true,
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Upload-Key'],
    }),
  );

  app.get('/health', async (c) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return c.json({ ok: true, db: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'db error';
      return c.json({ ok: false, db: false, error: message }, 503);
    }
  });

  app.route('/auth', authRoutes);
  app.route('/phong-ban', phongBanRoutes);
  app.route('/chuc-vu', chucVuRoutes);
  app.route('/nhan-vien', nhanVienRoutes);
  app.route('/cong-ty', congTyRoutes);
  app.route('/phan-quyen', phanQuyenRoutes);
  app.route('/uploads', uploadsRoutes);
  app.route('/nhom-khach-hang', nhomKhachHangRoutes);
  app.route('/trang-thai-khach-hang', trangThaiKhachHangRoutes);
  app.route('/khach-hang', khachHangRoutes);
  app.route('/nguoi-lien-he', nguoiLienHeRoutes);
  app.route('/loai-tai-lieu', loaiTaiLieuRoutes);
  app.route('/market-in', marketInRoutes);
  app.route('/phieu-hanh-chinh', phieuHanhChinhRoutes);
  app.route('/danh-sach-tai-lieu', danhSachTaiLieuRoutes);
  app.route('/hop-dong', hopDongRoutes);
  /** API path riêng — tránh đụng page inbox `/thong-bao`. */
  app.route('/hc-thong-bao', thongBaoRoutes);

  return app;
}

export const honoApp = createHonoApp();
