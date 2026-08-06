-- Công ty (singleton) + Phân quyền matrix tables
-- Safe to re-run (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS public.var_cong_ty (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  ten_ung_dung text NOT NULL DEFAULT '',
  mo_ta_ung_dung text,
  logo text,
  ten_cong_ty text NOT NULL DEFAULT '',
  ma_so_thue text NOT NULL DEFAULT '',
  dia_chi text,
  so_dien_thoai text,
  email text,
  website text,
  tg_tao timestamptz NOT NULL DEFAULT now(),
  tg_cap_nhat timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.var_phan_quyen (
  id serial PRIMARY KEY,
  module_key text NOT NULL,
  chuc_vu_id integer NOT NULL REFERENCES public.var_chuc_vu (id) ON DELETE CASCADE,
  quyen text NOT NULL DEFAULT '',
  tg_tao timestamptz NOT NULL DEFAULT now(),
  tg_cap_nhat timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chuc_vu_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_var_phan_quyen_chuc_vu_id ON public.var_phan_quyen (chuc_vu_id);
CREATE INDEX IF NOT EXISTS idx_var_phan_quyen_module_key ON public.var_phan_quyen (module_key);

-- Optional seed row for company singleton (no-op if already present)
INSERT INTO public.var_cong_ty (id, ten_ung_dung, ten_cong_ty, ma_so_thue)
VALUES (1, '5F ERP', '', '')
ON CONFLICT (id) DO NOTHING;
