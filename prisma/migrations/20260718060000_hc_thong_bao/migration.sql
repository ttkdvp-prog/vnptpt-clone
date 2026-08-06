-- Hành chính — thông báo nội bộ
CREATE TABLE IF NOT EXISTS "hc_thong_bao" (
  "id" SERIAL PRIMARY KEY,
  "tg_dang" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "tieu_de" TEXT NOT NULL,
  "noi_dung" TEXT NOT NULL,
  "id_chuc_vu" INTEGER[] NOT NULL DEFAULT '{}',
  "id_nguoi_tao" INTEGER,
  "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_hc_thong_bao_tg_dang" ON "hc_thong_bao" ("tg_dang" DESC);
CREATE INDEX IF NOT EXISTS "idx_hc_thong_bao_id_nguoi_tao" ON "hc_thong_bao" ("id_nguoi_tao");
CREATE INDEX IF NOT EXISTS "idx_hc_thong_bao_id_chuc_vu" ON "hc_thong_bao" USING GIN ("id_chuc_vu");
