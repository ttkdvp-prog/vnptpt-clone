-- Hợp đồng nhân sự (thử việc / chính thức)
-- Idempotent: safe if table was created earlier via emergency scripts.

CREATE TABLE IF NOT EXISTS "ns_hop_dong" (
    "id" SERIAL NOT NULL,
    "loai_hop_dong" TEXT NOT NULL,
    "ma_hop_dong" TEXT NOT NULL,
    "ngay_ky" DATE NOT NULL,
    "ngay_hieu_luc" DATE NOT NULL,
    "ngay_ket_thuc" DATE,
    "id_nhan_vien" INTEGER NOT NULL,
    "id_chuc_vu" INTEGER NOT NULL,
    "id_phong_ban" INTEGER NOT NULL,
    "muc_luong" TEXT NOT NULL,
    "hinh_thuc_tra_luong" TEXT NOT NULL,
    "che_do_khac" TEXT,
    "noi_lam_viec" TEXT,
    "thoi_gian_lam_viec" TEXT,
    "luu_y_khac" TEXT,
    "ghi_chu" TEXT,
    "trang_thai" TEXT NOT NULL DEFAULT 'chua_xong',
    "id_nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ns_hop_dong_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ns_hop_dong_ma_hop_dong_key"
  ON "ns_hop_dong"("ma_hop_dong");

CREATE INDEX IF NOT EXISTS "ns_hop_dong_id_nhan_vien_idx"
  ON "ns_hop_dong"("id_nhan_vien");

CREATE INDEX IF NOT EXISTS "ns_hop_dong_id_phong_ban_idx"
  ON "ns_hop_dong"("id_phong_ban");

CREATE INDEX IF NOT EXISTS "ns_hop_dong_loai_hop_dong_idx"
  ON "ns_hop_dong"("loai_hop_dong");

CREATE INDEX IF NOT EXISTS "ns_hop_dong_trang_thai_idx"
  ON "ns_hop_dong"("trang_thai");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ns_hop_dong_id_nhan_vien_fkey'
  ) THEN
    ALTER TABLE "ns_hop_dong"
      ADD CONSTRAINT "ns_hop_dong_id_nhan_vien_fkey"
      FOREIGN KEY ("id_nhan_vien") REFERENCES "var_nhan_vien"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ns_hop_dong_id_chuc_vu_fkey'
  ) THEN
    ALTER TABLE "ns_hop_dong"
      ADD CONSTRAINT "ns_hop_dong_id_chuc_vu_fkey"
      FOREIGN KEY ("id_chuc_vu") REFERENCES "var_chuc_vu"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ns_hop_dong_id_phong_ban_fkey'
  ) THEN
    ALTER TABLE "ns_hop_dong"
      ADD CONSTRAINT "ns_hop_dong_id_phong_ban_fkey"
      FOREIGN KEY ("id_phong_ban") REFERENCES "var_phong_ban"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed: chỉ khi bảng trống — 3 hợp đồng mẫu (thử việc + chính thức, chưa xong + đã xong)
INSERT INTO "ns_hop_dong"
  ("loai_hop_dong", "ma_hop_dong", "ngay_ky", "ngay_hieu_luc", "ngay_ket_thuc",
   "id_nhan_vien", "id_chuc_vu", "id_phong_ban",
   "muc_luong", "hinh_thuc_tra_luong", "che_do_khac", "noi_lam_viec",
   "thoi_gian_lam_viec", "luu_y_khac", "ghi_chu", "trang_thai", "id_nguoi_tao")
SELECT
  s.loai_hop_dong,
  s.ma_hop_dong,
  s.ngay_ky::date,
  s.ngay_hieu_luc::date,
  s.ngay_ket_thuc::date,
  nv.id,
  COALESCE(nv.id_chuc_vu, (SELECT cv2.id FROM "var_chuc_vu" cv2 ORDER BY cv2.id LIMIT 1)),
  COALESCE(nv.id_phong_ban, (SELECT pb2.id FROM "var_phong_ban" pb2 ORDER BY pb2.id LIMIT 1)),
  s.muc_luong,
  s.hinh_thuc_tra_luong,
  s.che_do_khac,
  s.noi_lam_viec,
  s.thoi_gian_lam_viec,
  s.luu_y_khac,
  s.ghi_chu,
  s.trang_thai,
  nv.id
FROM (
  VALUES
    ('thu_viec', 'HD-TV-0001',
     (CURRENT_DATE - INTERVAL '75 day')::date,
     (CURRENT_DATE - INTERVAL '70 day')::date,
     (CURRENT_DATE - INTERVAL '10 day')::date,
     1,
     '85% lương chính thức — 8.500.000 đ/tháng', 'theo_thang',
     'Hỗ trợ cơm trưa, gửi xe', 'Văn phòng công ty',
     'Thứ 2 - Thứ 7, 08:00 - 17:00', 'Thử việc 60 ngày theo quy định',
     'Hợp đồng thử việc mẫu', 'da_xong'),
    ('chinh_thuc', 'HD-CT-0001',
     (CURRENT_DATE - INTERVAL '9 day')::date,
     (CURRENT_DATE - INTERVAL '7 day')::date,
     NULL,
     1,
     '10.000.000 đ/tháng + phụ cấp', 'theo_thang',
     'BHXH, BHYT, BHTN theo luật; thưởng lễ Tết', 'Văn phòng công ty',
     'Thứ 2 - Thứ 7, 08:00 - 17:00', NULL,
     'Ký sau khi hoàn thành thử việc', 'da_xong'),
    ('thu_viec', 'HD-TV-0002',
     CURRENT_DATE,
     (CURRENT_DATE + INTERVAL '3 day')::date,
     (CURRENT_DATE + INTERVAL '63 day')::date,
     2,
     '7.650.000 đ/tháng', 'theo_thang',
     NULL, 'Nhà máy sản xuất',
     'Theo ca sản xuất', 'Đang soạn — chờ bổ sung điều khoản',
     NULL, 'chua_xong')
) AS s(loai_hop_dong, ma_hop_dong, ngay_ky, ngay_hieu_luc, ngay_ket_thuc, nv_ord,
       muc_luong, hinh_thuc_tra_luong, che_do_khac, noi_lam_viec,
       thoi_gian_lam_viec, luu_y_khac, ghi_chu, trang_thai)
JOIN LATERAL (
  SELECT nv2.id, nv2.id_chuc_vu, nv2.id_phong_ban
  FROM "var_nhan_vien" nv2
  ORDER BY nv2.id
  OFFSET (s.nv_ord - 1) LIMIT 1
) nv ON TRUE
WHERE NOT EXISTS (SELECT 1 FROM "ns_hop_dong")
  AND EXISTS (SELECT 1 FROM "var_chuc_vu")
  AND EXISTS (SELECT 1 FROM "var_phong_ban");
