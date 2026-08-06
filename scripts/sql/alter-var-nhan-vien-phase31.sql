-- Phase 3.1 — align var_nhan_vien with Employee domain (audit + contact fields).
-- Requires: public.var_nhan_vien already exists.
-- Apply: DATABASE_URL=... node scripts/apply-sql-migration.mjs scripts/sql/alter-var-nhan-vien-phase31.sql

ALTER TABLE public.var_nhan_vien
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS so_dien_thoai text DEFAULT '',
  ADD COLUMN IF NOT EXISTS gioi_tinh text DEFAULT 'Nam',
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nguoi_tao integer,
  ADD COLUMN IF NOT EXISTS tg_tao timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS tg_cap_nhat timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_var_nhan_vien_id_phong_ban ON public.var_nhan_vien (id_phong_ban);
CREATE INDEX IF NOT EXISTS idx_var_nhan_vien_id_chuc_vu ON public.var_nhan_vien (id_chuc_vu);
CREATE INDEX IF NOT EXISTS idx_var_nhan_vien_tai_khoan ON public.var_nhan_vien (tai_khoan);
