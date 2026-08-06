-- Phase 3.2 — var_phong_ban audit + mo_ta + thu_tu
ALTER TABLE public.var_phong_ban
  ADD COLUMN IF NOT EXISTS mo_ta text,
  ADD COLUMN IF NOT EXISTS thu_tu integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nguoi_tao integer,
  ADD COLUMN IF NOT EXISTS tg_tao timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tg_cap_nhat timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_var_phong_ban_id_cha ON public.var_phong_ban (id_cha);
