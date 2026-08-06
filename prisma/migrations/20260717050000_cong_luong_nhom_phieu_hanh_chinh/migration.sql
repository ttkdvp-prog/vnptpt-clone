-- Thiết lập công lương — loại phiếu (nhóm phiếu hành chính)
-- Idempotent: safe if table was created earlier via scripts/sql emergency path.

CREATE TABLE IF NOT EXISTS "cong_luong_nhom_phieu_hanh_chinh" (
    "id" SERIAL NOT NULL,
    "nhom_phieu" TEXT NOT NULL,
    "ma_phieu" TEXT NOT NULL,
    "ten_phieu" TEXT NOT NULL,
    "ghi_chu" TEXT,
    "id_nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cong_luong_nhom_phieu_hanh_chinh_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cong_luong_nhom_phieu_hanh_chinh_ma_phieu_key"
  ON "cong_luong_nhom_phieu_hanh_chinh"("ma_phieu");

CREATE UNIQUE INDEX IF NOT EXISTS "cong_luong_nhom_phieu_hanh_chinh_ten_phieu_key"
  ON "cong_luong_nhom_phieu_hanh_chinh"("ten_phieu");

CREATE INDEX IF NOT EXISTS "cong_luong_nhom_phieu_hanh_chinh_nhom_phieu_idx"
  ON "cong_luong_nhom_phieu_hanh_chinh"("nhom_phieu");

-- Seed: loại phiếu hành chính
INSERT INTO "cong_luong_nhom_phieu_hanh_chinh" ("nhom_phieu", "ma_phieu", "ten_phieu", "ghi_chu") VALUES
  ('Nghỉ phép', 'XN', 'Xin nghỉ', 'Phiếu xin nghỉ phép'),
  ('Nghỉ phép', 'NL', 'Nghỉ lễ', 'Nghỉ lễ, tết theo lịch'),
  ('Công tác', 'CT', 'Công tác', 'Đi công tác trong/ngoài nước'),
  ('Nghỉ phép', 'NP', 'Nghỉ phép năm', 'Nghỉ phép năm còn lại'),
  ('Nghỉ phép', 'NB', 'Nghỉ bệnh', 'Nghỉ ốm / nghỉ bệnh'),
  ('Điều chỉnh', 'DC', 'Điều chỉnh công', 'Điều chỉnh công chấm công')
ON CONFLICT ("ma_phieu") DO NOTHING;
