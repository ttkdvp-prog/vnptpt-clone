-- CreateTable
CREATE TABLE "sx_market_in" (
    "id" SERIAL NOT NULL,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "id_khach_hang" INTEGER NOT NULL,
    "ma_san_pham" TEXT NOT NULL,
    "ma_market" TEXT NOT NULL,
    "mo_ta" TEXT,
    "link_file" TEXT,
    "id_nguoi_ve" INTEGER,
    "trang_thai" TEXT NOT NULL DEFAULT 'cho_duyet',
    "ngay_hieu_luc" DATE,
    "id_nguoi_duyet" INTEGER,
    "tg_duyet" TIMESTAMPTZ(6),
    "nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sx_market_in_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sx_market_in_ma_market_key" ON "sx_market_in"("ma_market");

-- CreateIndex
CREATE INDEX "sx_market_in_id_khach_hang_idx" ON "sx_market_in"("id_khach_hang");

-- CreateIndex
CREATE INDEX "sx_market_in_trang_thai_idx" ON "sx_market_in"("trang_thai");

-- AddForeignKey
ALTER TABLE "sx_market_in" ADD CONSTRAINT "sx_market_in_id_khach_hang_fkey"
  FOREIGN KEY ("id_khach_hang") REFERENCES "kh_danh_sach_khach_hang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed: market in mẫu (join khách hàng theo mã; người vẽ/duyệt lấy NV theo thứ tự id nếu có)
INSERT INTO "sx_market_in"
  ("thu_tu", "id_khach_hang", "ma_san_pham", "ma_market", "mo_ta", "link_file",
   "id_nguoi_ve", "trang_thai", "ngay_hieu_luc", "id_nguoi_duyet", "tg_duyet")
SELECT
  s.thu_tu,
  kh.id,
  s.ma_san_pham,
  s.ma_market,
  s.mo_ta,
  s.link_file,
  ve.id,
  s.trang_thai,
  s.ngay_hieu_luc::date,
  CASE WHEN s.trang_thai = 'da_duyet' THEN duyet.id ELSE NULL END,
  CASE WHEN s.trang_thai = 'da_duyet' THEN CURRENT_TIMESTAMP ELSE NULL END
FROM (
  VALUES
    (1, 'KH0001', 'SP-BAG-001', 'MI0001', 'Market in túi PE trắng 30x40', 'https://drive.google.com/file/d/sample-mi0001', 'cho_duyet', NULL),
    (2, 'KH0001', 'SP-BAG-002', 'MI0002', 'Market in túi zipper xanh', 'https://drive.google.com/file/d/sample-mi0002', 'da_duyet', '2026-06-01'),
    (3, 'KH0002', 'SP-FILM-010', 'MI0003', 'Market in màng thổi 2 lớp', NULL, 'cho_duyet', NULL),
    (4, 'KH0003', 'SP-BAG-015', 'MI0004', 'Market in túi shopping in offset', 'https://drive.google.com/file/d/sample-mi0004', 'da_duyet', '2026-05-15'),
    (5, 'KH0004', 'SP-CUT-003', 'MI0005', 'Market in ống cắt 50mm', NULL, 'ngung_ap_dung', '2025-12-01'),
    (6, 'KH0005', 'SP-BAG-020', 'MI0006', 'Market in bao bì thực phẩm', 'https://drive.google.com/file/d/sample-mi0006', 'cho_duyet', NULL),
    (7, 'KH0006', 'SP-FILM-022', 'MI0007', 'Market in màng co nhiệt', NULL, 'da_duyet', '2026-07-01'),
    (8, 'KH0007', 'SP-BAG-099', 'MI0008', 'Market in mẫu cũ — ngừng dùng', NULL, 'ngung_ap_dung', '2025-01-01')
) AS s(thu_tu, ma_kh, ma_san_pham, ma_market, mo_ta, link_file, trang_thai, ngay_hieu_luc)
JOIN "kh_danh_sach_khach_hang" kh ON kh."ma_khach_hang" = s.ma_kh
LEFT JOIN LATERAL (
  SELECT id FROM "var_nhan_vien" ORDER BY id ASC LIMIT 1 OFFSET 0
) ve ON true
LEFT JOIN LATERAL (
  SELECT id FROM "var_nhan_vien" ORDER BY id ASC LIMIT 1 OFFSET 1
) duyet ON true
ON CONFLICT ("ma_market") DO NOTHING;
