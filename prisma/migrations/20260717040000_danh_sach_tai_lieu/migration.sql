-- CreateTable
CREATE TABLE "tai_lieu_danh_sach_tai_lieu" (
    "id" SERIAL NOT NULL,
    "id_loai_tai_lieu" INTEGER NOT NULL,
    "ten_tai_lieu" TEXT NOT NULL,
    "mo_ta" TEXT,
    "link_tai_lieu" TEXT,
    "ghi_chu" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'du_thao',
    "id_chuc_vu" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "id_nhan_vien" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "id_nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tai_lieu_danh_sach_tai_lieu_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tai_lieu_danh_sach_tai_lieu" ADD CONSTRAINT "tai_lieu_danh_sach_tai_lieu_id_loai_tai_lieu_fkey" FOREIGN KEY ("id_loai_tai_lieu") REFERENCES "tai_lieu_thiet_lap_loai_tai_lieu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "tai_lieu_danh_sach_tai_lieu_id_loai_tai_lieu_idx" ON "tai_lieu_danh_sach_tai_lieu"("id_loai_tai_lieu");

-- CreateIndex
CREATE INDEX "tai_lieu_danh_sach_tai_lieu_trang_thai_idx" ON "tai_lieu_danh_sach_tai_lieu"("trang_thai");

-- Seed: danh sách tài liệu (cần đã seed loại tài liệu)
INSERT INTO "tai_lieu_danh_sach_tai_lieu" (
  "id_loai_tai_lieu", "ten_tai_lieu", "mo_ta", "link_tai_lieu", "ghi_chu", "trang_thai", "id_chuc_vu", "id_nhan_vien"
)
SELECT l.id, v.ten_tai_lieu, v.mo_ta, v.link_tai_lieu, v.ghi_chu, v.trang_thai, '{}'::INTEGER[], '{}'::INTEGER[]
FROM (VALUES
  ('Hợp đồng', 'Mẫu hợp đồng lao động', 'Mẫu chuẩn dùng khi ký HĐLĐ', 'https://example.com/hop-dong-ld', 'Dùng nội bộ HCNS', 'hieu_luc'),
  ('Biên bản', 'Biên bản bàn giao tài sản', 'Mẫu biên bản khi bàn giao thiết bị', NULL, NULL, 'du_thao'),
  ('Quy trình', 'SOP tiếp nhận khách hàng', 'Quy trình tiếp nhận và chăm sóc KH mới', 'https://example.com/sop-kh', 'Cần rà soát định kỳ', 'cho_sua'),
  ('Công văn', 'Công văn thông báo nghỉ lễ', 'Mẫu thông báo nghỉ lễ năm', NULL, 'Lỗi thời — thay bản mới', 'loi_thoi')
) AS v(ten_loai, ten_tai_lieu, mo_ta, link_tai_lieu, ghi_chu, trang_thai)
JOIN "tai_lieu_thiet_lap_loai_tai_lieu" l ON l.ten_loai_tai_lieu = v.ten_loai
WHERE NOT EXISTS (
  SELECT 1 FROM "tai_lieu_danh_sach_tai_lieu" d
  WHERE d.ten_tai_lieu = v.ten_tai_lieu AND d.id_loai_tai_lieu = l.id
);
