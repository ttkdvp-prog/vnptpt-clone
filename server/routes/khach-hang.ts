import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertKhachHangPermission } from '@/server/permissions/khach-hang';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  createKhachHang,
  deleteKhachHang,
  findKhachHangById,
  findKhachHangPage,
  getKhachHangNguoiTao,
  getNextMaKhachHang,
  updateKhachHang,
} from '@/server/repositories/khach-hang';

const khachHangRoutes = new Hono<{ Variables: AuthVariables }>();
khachHangRoutes.use('*', requireAuth);

const createBodySchema = z.object({
  ma_khach_hang: z.string().min(1),
  ten_khach_hang: z.string().min(1),
  so_dien_thoai: z.union([z.string(), z.null()]).optional(),
  dia_chi: z.union([z.string(), z.null()]).optional(),
  ghi_chu: z.union([z.string(), z.null()]).optional(),
  id_nhom: z.string().min(1),
  id_trang_thai: z.string().min(1),
});

const updateBodySchema = createBodySchema.partial();

const UNIQUE_MESSAGE = 'Mã khách hàng đã tồn tại';

async function createOne(
  body: z.infer<typeof createBodySchema>,
  employeeId: string,
): Promise<Awaited<ReturnType<typeof createKhachHang>>> {
  return createKhachHang({
    ma_khach_hang: body.ma_khach_hang.trim(),
    ten_khach_hang: body.ten_khach_hang.trim(),
    so_dien_thoai: body.so_dien_thoai ?? null,
    dia_chi: body.dia_chi ?? null,
    ghi_chu: body.ghi_chu ?? null,
    id_nhom: body.id_nhom,
    id_trang_thai: body.id_trang_thai,
    nguoi_tao: employeeId,
  });
}

khachHangRoutes.get('/', async (c) => {
  const denied = await assertKhachHangPermission(c, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'ma_khach_hang';
  const ascending = c.req.query('ascending') !== 'false';
  const search = c.req.query('search') ?? undefined;

  const result = await findKhachHangPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
  });
  return c.json(result);
});

khachHangRoutes.get('/next-ma', async (c) => {
  const denied = await assertKhachHangPermission(c, 'them');
  if (denied) return denied;
  const ma = await getNextMaKhachHang();
  return c.json({ ma_khach_hang: ma });
});

khachHangRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findKhachHangById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertKhachHangPermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  return c.json(item);
});

khachHangRoutes.post('/', async (c) => {
  const denied = await assertKhachHangPermission(c, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = createBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const session = c.get('session');

  try {
    const item = await createOne(body, session.employee_id);
    return c.json(item, 201);
  } catch (err) {
    return c.json({ error: translateCreateError(err, UNIQUE_MESSAGE) }, 400);
  }
});

khachHangRoutes.post('/import', async (c) => {
  const denied = await assertKhachHangPermission(c, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const items = Array.isArray((raw as { items?: unknown[] })?.items)
    ? (raw as { items: unknown[] }).items
    : null;
  if (!items) return c.json({ error: 'Invalid body' }, 400);
  if (items.length > BULK_IMPORT_MAX_ITEMS) {
    return c.json({ error: `Tối đa ${BULK_IMPORT_MAX_ITEMS} dòng mỗi lần import` }, 400);
  }
  const session = c.get('session');

  const result = await runBulkImport(
    items,
    async (item) => {
      const parsed = createBodySchema.safeParse(item);
      if (!parsed.success) {
        throw new Error(bulkImportZodMessage(parsed.error));
      }
      await createOne(parsed.data, session.employee_id);
    },
    (err) => translateCreateError(err, UNIQUE_MESSAGE),
  );
  return c.json(result);
});

khachHangRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const nguoiTao = await getKhachHangNguoiTao(id);
  const denied = await assertKhachHangPermission(c, 'sua', {
    recordNguoiTao: nguoiTao,
  });
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;

  try {
    const item = await updateKhachHang(id, {
      ma_khach_hang: body.ma_khach_hang != null ? body.ma_khach_hang.trim() : undefined,
      ten_khach_hang: body.ten_khach_hang != null ? body.ten_khach_hang.trim() : undefined,
      so_dien_thoai: body.so_dien_thoai,
      dia_chi: body.dia_chi,
      ghi_chu: body.ghi_chu,
      id_nhom: body.id_nhom,
      id_trang_thai: body.id_trang_thai,
    });
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err, UNIQUE_MESSAGE) }, 400);
  }
});

khachHangRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertKhachHangPermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deleteKhachHang(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { khachHangRoutes };
