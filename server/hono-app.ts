import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth';
import { nhanVienRoutes } from './routes/nhan-vien';
import { congTyRoutes } from './routes/cong-ty';
import { phanQuyenRoutes } from './routes/phan-quyen';
import { uploadsRoutes } from './routes/uploads';
import { taiLieuRoutes } from './routes/tai-lieu';
import { congViecRoutes } from './routes/cong-viec';
import { getSheetsClient } from '@/lib/sheets/client';
import { SHEETS_SPREADSHEET_ID } from '@/lib/sheets/config';

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

  app.onError((err, c) => {
    console.error('[hono]', c.req.method, c.req.path, err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return c.json({ error: message }, 500);
  });

  app.get('/health', async (c) => {
    try {
      await getSheetsClient().spreadsheets.get({ spreadsheetId: SHEETS_SPREADSHEET_ID });
      return c.json({ ok: true, db: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'db error';
      return c.json({ ok: false, db: false, error: message }, 503);
    }
  });

  app.route('/auth', authRoutes);
  app.route('/nhan-vien', nhanVienRoutes);
  app.route('/cong-ty', congTyRoutes);
  app.route('/phan-quyen', phanQuyenRoutes);
  app.route('/uploads', uploadsRoutes);
  app.route('/tai-lieu', taiLieuRoutes);
  app.route('/danh-sach-cong-viec', congViecRoutes);

  return app;
}

export const honoApp = createHonoApp();
