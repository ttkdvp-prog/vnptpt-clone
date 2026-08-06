-- HR profile fields on var_nhan_vien
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "email_ca_nhan" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "que_quan" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "dan_toc" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ton_giao" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "tinh_trang_hon_nhan" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "quoc_tich" TEXT;

ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ngay_vao_lam" DATE;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ngay_chinh_thuc" DATE;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ngay_nghi_viec" DATE;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ly_do_nghi" TEXT;

ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "so_tai_khoan" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ten_chu_tai_khoan" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ngan_hang" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "chi_nhanh" TEXT;

ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "nguoi_lien_he_khan" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "sdt_khan" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "moi_quan_he" TEXT;

ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "so_bhyt" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "ma_so_thue_ca_nhan" TEXT;

ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "trinh_do" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "chuyen_nganh" TEXT;
ALTER TABLE "var_nhan_vien" ADD COLUMN IF NOT EXISTS "truong" TEXT;

CREATE INDEX IF NOT EXISTS "var_nhan_vien_trang_thai_idx" ON "var_nhan_vien"("trang_thai");
CREATE INDEX IF NOT EXISTS "var_nhan_vien_ngay_vao_lam_idx" ON "var_nhan_vien"("ngay_vao_lam");
