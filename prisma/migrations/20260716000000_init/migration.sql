-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "var_phong_ban" (
    "id" SERIAL NOT NULL,
    "ma_phong_ban" TEXT NOT NULL,
    "ten_phong_ban" TEXT NOT NULL,
    "id_cha" INTEGER,
    "trang_thai" TEXT NOT NULL DEFAULT 'active',
    "mo_ta" TEXT,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "var_phong_ban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "var_chuc_vu" (
    "id" SERIAL NOT NULL,
    "id_phong_ban" INTEGER NOT NULL,
    "ma_chuc_vu" TEXT NOT NULL,
    "ten_chuc_vu" TEXT NOT NULL,
    "cap_bac" INTEGER NOT NULL DEFAULT 1,
    "mo_ta" TEXT,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" TEXT NOT NULL DEFAULT 'active',
    "nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "var_chuc_vu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "var_nhan_vien" (
    "id" SERIAL NOT NULL,
    "ho_va_ten" TEXT NOT NULL,
    "hinh_anh" TEXT,
    "email" TEXT DEFAULT '',
    "so_dien_thoai" TEXT DEFAULT '',
    "gioi_tinh" TEXT DEFAULT 'Nam',
    "trang_thai" TEXT NOT NULL DEFAULT 'ACTIVE',
    "id_chuc_vu" INTEGER,
    "id_phong_ban" INTEGER,
    "cap_bac" INTEGER,
    "tai_khoan" TEXT NOT NULL,
    "mat_khau" TEXT NOT NULL,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "var_nhan_vien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "var_cong_ty" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ten_ung_dung" TEXT NOT NULL DEFAULT '',
    "mo_ta_ung_dung" TEXT,
    "logo" TEXT,
    "ten_cong_ty" TEXT NOT NULL DEFAULT '',
    "ma_so_thue" TEXT NOT NULL DEFAULT '',
    "dia_chi" TEXT,
    "so_dien_thoai" TEXT,
    "email" TEXT,
    "website" TEXT,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "var_cong_ty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "var_phan_quyen" (
    "id" SERIAL NOT NULL,
    "module_key" TEXT NOT NULL,
    "chuc_vu_id" INTEGER NOT NULL,
    "quyen" TEXT NOT NULL DEFAULT '',
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "var_phan_quyen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "var_phong_ban_id_cha_idx" ON "var_phong_ban"("id_cha");

-- CreateIndex
CREATE INDEX "var_chuc_vu_id_phong_ban_idx" ON "var_chuc_vu"("id_phong_ban");

-- CreateIndex
CREATE INDEX "var_chuc_vu_trang_thai_idx" ON "var_chuc_vu"("trang_thai");

-- CreateIndex
CREATE UNIQUE INDEX "var_nhan_vien_tai_khoan_key" ON "var_nhan_vien"("tai_khoan");

-- CreateIndex
CREATE INDEX "var_nhan_vien_id_phong_ban_idx" ON "var_nhan_vien"("id_phong_ban");

-- CreateIndex
CREATE INDEX "var_nhan_vien_id_chuc_vu_idx" ON "var_nhan_vien"("id_chuc_vu");

-- CreateIndex
CREATE INDEX "var_nhan_vien_tai_khoan_idx" ON "var_nhan_vien"("tai_khoan");

-- CreateIndex
CREATE INDEX "var_phan_quyen_chuc_vu_id_idx" ON "var_phan_quyen"("chuc_vu_id");

-- CreateIndex
CREATE INDEX "var_phan_quyen_module_key_idx" ON "var_phan_quyen"("module_key");

-- CreateIndex
CREATE UNIQUE INDEX "var_phan_quyen_chuc_vu_id_module_key_key" ON "var_phan_quyen"("chuc_vu_id", "module_key");

-- AddForeignKey
ALTER TABLE "var_phong_ban" ADD CONSTRAINT "var_phong_ban_id_cha_fkey" FOREIGN KEY ("id_cha") REFERENCES "var_phong_ban"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "var_chuc_vu" ADD CONSTRAINT "var_chuc_vu_id_phong_ban_fkey" FOREIGN KEY ("id_phong_ban") REFERENCES "var_phong_ban"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "var_nhan_vien" ADD CONSTRAINT "var_nhan_vien_id_chuc_vu_fkey" FOREIGN KEY ("id_chuc_vu") REFERENCES "var_chuc_vu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "var_nhan_vien" ADD CONSTRAINT "var_nhan_vien_id_phong_ban_fkey" FOREIGN KEY ("id_phong_ban") REFERENCES "var_phong_ban"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "var_phan_quyen" ADD CONSTRAINT "var_phan_quyen_chuc_vu_id_fkey" FOREIGN KEY ("chuc_vu_id") REFERENCES "var_chuc_vu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

