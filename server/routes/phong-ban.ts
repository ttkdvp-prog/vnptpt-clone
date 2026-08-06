import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertPhongBanPermission } from '@/server/permissions/phong-ban';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  createDepartment,
  deleteDepartment,
  deleteDepartmentsMany,
  findDepartmentById,
  findDepartmentsPage,
  getDepartmentNguoiTao,
  updateDepartment,
  updateDepartmentStatusMany,
} from '@/server/repositories/phong-ban';

const phongBanRoutes = new Hono<{ Variables: AuthVariables }>();
phongBanRoutes.use('*', requireAuth);

const createBodySchema = z.object({
  ma_phong_ban: z.string().min(1),
  ten_phong_ban: z.string().min(1),
  cha_id: z.union([z.string(), z.null()]).optional(),
  trang_thai: z.string().optional(),
  mo_ta: z.union([z.string(), z.null()]).optional(),
  thu_tu: z.union([z.number(), z.string()]).optional(),
});

const updateBodySchema = createBodySchema.partial();

function parseThuTu(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

async function createOne(
  body: z.infer<typeof createBodySchema>,
  employeeId: string,
): Promise<Awaited<ReturnType<typeof createDepartment>>> {
  return createDepartment({
    ma_phong_ban: body.ma_phong_ban.trim(),
    ten_phong_ban: body.ten_phong_ban.trim(),
    cha_id: body.cha_id ?? null,
    trang_thai: body.trang_thai,
    mo_ta: body.mo_ta ?? null,
    thu_tu: parseThuTu(body.thu_tu) ?? 0,
    nguoi_tao: employeeId,
  });
}

phongBanRoutes.get('/', async (c) => {
  const denied = await assertPhongBanPermission(c, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'thu_tu';
  const ascending = c.req.query('ascending') !== 'false';
  const search = c.req.query('search') ?? undefined;

  const result = await findDepartmentsPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
  });
  return c.json(result);
});

/** Bulk status — must be registered before /:id */
phongBanRoutes.patch('/status/bulk', async (c) => {
  const denied = await assertPhongBanPermission(c, 'sua');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const idsRaw = Array.isArray(raw.ids) ? raw.ids : [];
  const ids = idsRaw.map((v: unknown) => Number(v)).filter((n: number) => Number.isFinite(n));
  const trangThai = String(raw.trang_thai ?? '').trim();
  if (ids.length === 0 || !trangThai) {
    return c.json({ error: 'ids và trang_thai là bắt buộc' }, 400);
  }

  const items = await updateDepartmentStatusMany(ids, trangThai);
  return c.json({ items, total: items.length });
});

/** Bulk delete — must be registered before /:id. Bỏ qua (không xóa) phòng ban còn phòng con. */
phongBanRoutes.delete('/bulk', async (c) => {
  const denied = await assertPhongBanPermission(c, 'xoa');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const idsRaw = Array.isArray(raw.ids) ? raw.ids : [];
  const ids = idsRaw.map((v: unknown) => Number(v)).filter((n: number) => Number.isFinite(n));
  if (ids.length === 0) return c.json({ error: 'ids là bắt buộc' }, 400);

  const { deletedCount, skippedIds } = await deleteDepartmentsMany(ids);
  return c.json({ ok: true, deletedCount, skippedIds });
});

phongBanRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findDepartmentById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertPhongBanPermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  return c.json(item);
});

phongBanRoutes.post('/', async (c) => {
  const denied = await assertPhongBanPermission(c, 'them');
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
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

phongBanRoutes.post('/import', async (c) => {
  const denied = await assertPhongBanPermission(c, 'them');
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
    (err) => translateCreateError(err),
  );
  return c.json(result);
});

phongBanRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const nguoiTao = await getDepartmentNguoiTao(id);
  const denied = await assertPhongBanPermission(c, 'sua', {
    recordNguoiTao: nguoiTao,
  });
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;

  const item = await updateDepartment(id, {
    ma_phong_ban: body.ma_phong_ban != null ? body.ma_phong_ban.trim() : undefined,
    ten_phong_ban: body.ten_phong_ban != null ? body.ten_phong_ban.trim() : undefined,
    cha_id: body.cha_id,
    trang_thai: body.trang_thai,
    mo_ta: body.mo_ta,
    thu_tu: parseThuTu(body.thu_tu),
  });

  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
});

phongBanRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertPhongBanPermission(c, 'xoa');
  if (denied) return denied;

  const result = await deleteDepartment(id);
  if ('error' in result) {
    const status = result.error === 'Not found' ? 404 : 400;
    return c.json({ error: result.error }, status);
  }
  return c.json({ ok: true });
});

export { phongBanRoutes };
