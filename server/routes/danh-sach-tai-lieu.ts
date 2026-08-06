import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import {
  assertDanhSachTaiLieuPermission,
  resolveDocumentListViewer,
} from '@/server/permissions/danh-sach-tai-lieu';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  canViewerAccessDocument,
  createDanhSachTaiLieu,
  deleteDanhSachTaiLieu,
  findDanhSachTaiLieuById,
  findDanhSachTaiLieuPage,
  getDanhSachTaiLieuNguoiTao,
  getDocumentStatsAggregates,
  updateDanhSachTaiLieu,
} from '@/server/repositories/danh-sach-tai-lieu';

function parseCsvQuery(raw: string | undefined): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

const danhSachTaiLieuRoutes = new Hono<{ Variables: AuthVariables }>();
danhSachTaiLieuRoutes.use('*', requireAuth);

const STATUS_VALUES = ['du_thao', 'hieu_luc', 'loi_thoi', 'cho_sua'] as const;

const createBodySchema = z.object({
  id_loai_tai_lieu: z.string().min(1),
  ten_tai_lieu: z.string().min(1),
  mo_ta: z.union([z.string(), z.null()]).optional(),
  link_tai_lieu: z.union([z.string(), z.null()]).optional(),
  ghi_chu: z.union([z.string(), z.null()]).optional(),
  trang_thai: z.enum(STATUS_VALUES),
  id_chuc_vu: z.array(z.string()).optional(),
  id_nhan_vien: z.array(z.string()).optional(),
});

const updateBodySchema = createBodySchema.partial();

async function createOne(
  body: z.infer<typeof createBodySchema>,
  employeeId: string,
): Promise<Awaited<ReturnType<typeof createDanhSachTaiLieu>>> {
  return createDanhSachTaiLieu({
    id_loai_tai_lieu: body.id_loai_tai_lieu,
    ten_tai_lieu: body.ten_tai_lieu.trim(),
    mo_ta: body.mo_ta ?? null,
    link_tai_lieu: body.link_tai_lieu ?? null,
    ghi_chu: body.ghi_chu ?? null,
    trang_thai: body.trang_thai,
    id_chuc_vu: body.id_chuc_vu ?? [],
    id_nhan_vien: body.id_nhan_vien ?? [],
    nguoi_tao: employeeId,
  });
}

danhSachTaiLieuRoutes.get('/', async (c) => {
  const denied = await assertDanhSachTaiLieuPermission(c, 'xem');
  if (denied) return denied;

  const viewer = await resolveDocumentListViewer(c);
  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'tg_cap_nhat';
  const ascending = c.req.query('ascending') === 'true';
  const search = c.req.query('search') ?? undefined;

  const result = await findDanhSachTaiLieuPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    search,
    viewer,
    id_loai_tai_lieu: parseCsvQuery(c.req.query('id_loai_tai_lieu') ?? undefined),
    trang_thai: parseCsvQuery(c.req.query('trang_thai') ?? undefined),
    nguoi_tao: parseCsvQuery(c.req.query('nguoi_tao') ?? undefined),
    from: c.req.query('from') ?? undefined,
    to: c.req.query('to') ?? undefined,
  });
  return c.json(result);
});

danhSachTaiLieuRoutes.get('/stats/aggregates', async (c) => {
  const denied = await assertDanhSachTaiLieuPermission(c, 'xem');
  if (denied) return denied;

  const viewer = await resolveDocumentListViewer(c);
  const aggregates = await getDocumentStatsAggregates({
    viewer,
    id_loai_tai_lieu: parseCsvQuery(c.req.query('id_loai_tai_lieu') ?? undefined),
    trang_thai: parseCsvQuery(c.req.query('trang_thai') ?? undefined),
    nguoi_tao: parseCsvQuery(c.req.query('nguoi_tao') ?? undefined),
    from: c.req.query('from') ?? undefined,
    to: c.req.query('to') ?? undefined,
  });
  return c.json(aggregates);
});

danhSachTaiLieuRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const item = await findDanhSachTaiLieuById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertDanhSachTaiLieuPermission(c, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  const viewer = await resolveDocumentListViewer(c);
  if (!canViewerAccessDocument(item, viewer)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  return c.json(item);
});

danhSachTaiLieuRoutes.post('/', async (c) => {
  const denied = await assertDanhSachTaiLieuPermission(c, 'them');
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

danhSachTaiLieuRoutes.post('/import', async (c) => {
  const denied = await assertDanhSachTaiLieuPermission(c, 'them');
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

danhSachTaiLieuRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const nguoiTao = await getDanhSachTaiLieuNguoiTao(id);
  const denied = await assertDanhSachTaiLieuPermission(c, 'sua', {
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
    const item = await updateDanhSachTaiLieu(id, {
      id_loai_tai_lieu: body.id_loai_tai_lieu,
      ten_tai_lieu: body.ten_tai_lieu != null ? body.ten_tai_lieu.trim() : undefined,
      mo_ta: body.mo_ta,
      link_tai_lieu: body.link_tai_lieu,
      ghi_chu: body.ghi_chu,
      trang_thai: body.trang_thai,
      id_chuc_vu: body.id_chuc_vu,
      id_nhan_vien: body.id_nhan_vien,
    });
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  } catch (err) {
    return c.json({ error: translateCreateError(err) }, 400);
  }
});

danhSachTaiLieuRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertDanhSachTaiLieuPermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deleteDanhSachTaiLieu(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { danhSachTaiLieuRoutes };
