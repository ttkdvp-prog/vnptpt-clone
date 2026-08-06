-- Phase 3.3 — var_chuc_vu status + audit + mo_ta + thu_tu
ALTER TABLE public.var_chuc_vu
  ADD COLUMN IF NOT EXISTS mo_ta text,
  ADD COLUMN IF NOT EXISTS thu_tu integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trang_thai text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS nguoi_tao integer,
  ADD COLUMN IF NOT EXISTS tg_tao timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tg_cap_nhat timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_var_chuc_vu_id_phong_ban ON public.var_chuc_vu (id_phong_ban);
CREATE INDEX IF NOT EXISTS idx_var_chuc_vu_trang_thai ON public.var_chuc_vu (trang_thai);
