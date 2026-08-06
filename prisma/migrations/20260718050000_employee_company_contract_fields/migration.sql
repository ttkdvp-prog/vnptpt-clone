-- Employee identity fields for labor contracts
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ngay_sinh" DATE;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "so_cccd" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ngay_cap_cccd" DATE;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "noi_cap_cccd" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "dia_chi_thuong_tru" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "dia_chi_hien_tai" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "so_so_bhxh" TEXT;

-- Company legal representative + default signing place
ALTER TABLE "var_cong_ty" ADD COLUMN IF NOT EXISTS "nguoi_dai_dien" TEXT;
ALTER TABLE "var_cong_ty" ADD COLUMN IF NOT EXISTS "chuc_vu_nguoi_dai_dien" TEXT;
ALTER TABLE "var_cong_ty" ADD COLUMN IF NOT EXISTS "dia_diem_ky" TEXT;
