-- CreateTable
CREATE TABLE "tai_lieu_thiet_lap_loai_tai_lieu" (
    "id" SERIAL NOT NULL,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "ten_loai_tai_lieu" TEXT NOT NULL,
    "mo_ta" TEXT,
    "id_nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tai_lieu_thiet_lap_loai_tai_lieu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tai_lieu_thiet_lap_loai_tai_lieu_ten_loai_tai_lieu_key" ON "tai_lieu_thiet_lap_loai_tai_lieu"("ten_loai_tai_lieu");

-- Seed: loại tài liệu
INSERT INTO "tai_lieu_thiet_lap_loai_tai_lieu" ("thu_tu", "ten_loai_tai_lieu", "mo_ta") VALUES
  (1, 'Hợp đồng', 'Hợp đồng, thỏa thuận, phụ lục'),
  (2, 'Biên bản', 'Biên bản họp, bàn giao, nghiệm thu'),
  (3, 'Quy trình', 'Quy trình nội bộ, SOP, hướng dẫn'),
  (4, 'Công văn', 'Công văn đến / đi, thông báo nội bộ'),
  (5, 'Hồ sơ nhân sự', 'Hồ sơ cá nhân, quyết định nhân sự')
ON CONFLICT ("ten_loai_tai_lieu") DO NOTHING;
