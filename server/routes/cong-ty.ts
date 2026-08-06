import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertCongTyPermission } from '@/server/permissions/cong-ty';
import {
  emptyCompanyDefaults,
  findCompany,
  mapCompanyBranding,
  mapCompanyRow,
  upsertCompany,
} from '@/server/repositories/cong-ty';

const congTyRoutes = new Hono<{ Variables: AuthVariables }>();
congTyRoutes.use('*', requireAuth);

/** Any authenticated user — shell/PWA branding (no module xem required). */
congTyRoutes.get('/branding', async (c) => {
  const row = await findCompany();
  return c.json(mapCompanyBranding(row));
});

const patchBodySchema = z
  .object({
    ten_ung_dung: z.string().optional(),
    appName: z.string().optional(),
    mo_ta_ung_dung: z.union([z.string(), z.null()]).optional(),
    appDescription: z.union([z.string(), z.null()]).optional(),
    logo: z.union([z.string(), z.null()]).optional(),
    appLogo: z.union([z.string(), z.null()]).optional(),
    ten_cong_ty: z.string().optional(),
    companyName: z.string().optional(),
    ma_so_thue: z.string().optional(),
    taxId: z.string().optional(),
    dia_chi: z.union([z.string(), z.null()]).optional(),
    address: z.union([z.string(), z.null()]).optional(),
    so_dien_thoai: z.union([z.string(), z.null()]).optional(),
    phone: z.union([z.string(), z.null()]).optional(),
    email: z.union([z.string(), z.null()]).optional(),
    website: z.union([z.string(), z.null()]).optional(),
    nguoi_dai_dien: z.union([z.string(), z.null()]).optional(),
    representative: z.union([z.string(), z.null()]).optional(),
    chuc_vu_nguoi_dai_dien: z.union([z.string(), z.null()]).optional(),
    representativeTitle: z.union([z.string(), z.null()]).optional(),
    dia_diem_ky: z.union([z.string(), z.null()]).optional(),
    signingPlace: z.union([z.string(), z.null()]).optional(),
  })
  .superRefine((body, ctx) => {
    const appName = String(body.ten_ung_dung ?? body.appName ?? '').trim();
    const companyName = String(body.ten_cong_ty ?? body.companyName ?? '').trim();
    const taxId = String(body.ma_so_thue ?? body.taxId ?? '').trim();
    if (appName.length < 2) {
      ctx.addIssue({ code: 'custom', message: 'appName min 2', path: ['appName'] });
    }
    if (companyName.length < 2) {
      ctx.addIssue({ code: 'custom', message: 'companyName min 2', path: ['companyName'] });
    }
    if (taxId.length < 5) {
      ctx.addIssue({ code: 'custom', message: 'taxId min 5', path: ['taxId'] });
    }
    const desc = body.mo_ta_ung_dung ?? body.appDescription;
    if (desc != null && String(desc).length > 30) {
      ctx.addIssue({ code: 'custom', message: 'appDescription max 30', path: ['appDescription'] });
    }
    const email = body.email;
    if (email != null && email !== '' && !z.string().email().safeParse(email).success) {
      ctx.addIssue({ code: 'custom', message: 'email invalid', path: ['email'] });
    }
  });

function nullishString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value == null || value === '') return null;
  return String(value);
}

congTyRoutes.get('/', async (c) => {
  const denied = await assertCongTyPermission(c, 'xem');
  if (denied) return denied;

  const row = await findCompany();
  if (!row) return c.json(emptyCompanyDefaults());
  return c.json(mapCompanyRow(row));
});

congTyRoutes.patch('/', async (c) => {
  const denied = await assertCongTyPermission(c, 'sua');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const parsed = patchBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;

  const row = await upsertCompany({
    ten_ung_dung: String(body.ten_ung_dung ?? body.appName ?? '').trim(),
    mo_ta_ung_dung:
      body.mo_ta_ung_dung !== undefined
        ? nullishString(body.mo_ta_ung_dung) ?? null
        : body.appDescription !== undefined
          ? nullishString(body.appDescription) ?? null
          : undefined,
    logo:
      body.logo !== undefined
        ? nullishString(body.logo) ?? null
        : body.appLogo !== undefined
          ? nullishString(body.appLogo) ?? null
          : undefined,
    ten_cong_ty: String(body.ten_cong_ty ?? body.companyName ?? '').trim(),
    ma_so_thue: String(body.ma_so_thue ?? body.taxId ?? '').trim(),
    dia_chi:
      body.dia_chi !== undefined
        ? nullishString(body.dia_chi) ?? null
        : body.address !== undefined
          ? nullishString(body.address) ?? null
          : undefined,
    so_dien_thoai:
      body.so_dien_thoai !== undefined
        ? nullishString(body.so_dien_thoai) ?? null
        : body.phone !== undefined
          ? nullishString(body.phone) ?? null
          : undefined,
    email: body.email !== undefined ? nullishString(body.email) ?? null : undefined,
    website: body.website !== undefined ? nullishString(body.website) ?? null : undefined,
    nguoi_dai_dien:
      body.nguoi_dai_dien !== undefined
        ? nullishString(body.nguoi_dai_dien) ?? null
        : body.representative !== undefined
          ? nullishString(body.representative) ?? null
          : undefined,
    chuc_vu_nguoi_dai_dien:
      body.chuc_vu_nguoi_dai_dien !== undefined
        ? nullishString(body.chuc_vu_nguoi_dai_dien) ?? null
        : body.representativeTitle !== undefined
          ? nullishString(body.representativeTitle) ?? null
          : undefined,
    dia_diem_ky:
      body.dia_diem_ky !== undefined
        ? nullishString(body.dia_diem_ky) ?? null
        : body.signingPlace !== undefined
          ? nullishString(body.signingPlace) ?? null
          : undefined,
  });

  return c.json(mapCompanyRow(row));
});

export { congTyRoutes };
