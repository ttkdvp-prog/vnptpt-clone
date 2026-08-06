-- Người liên hệ — bảng + seed
-- Official path: Prisma Migrate (prisma/migrations/20260717020000_nguoi_lien_he).
-- This file is for manual/emergency apply.
-- Requires: kh_danh_sach_khach_hang (đã seed).

CREATE TABLE IF NOT EXISTS "kh_nguoi_lien_he" (
    "id" SERIAL NOT NULL,
    "id_khach_hang" INTEGER NOT NULL,
    "ho_ten" TEXT NOT NULL,
    "ngay_sinh" TEXT,
    "chuc_vu" TEXT,
    "so_dien_thoai" TEXT,
    "email" TEXT,
    "dia_chi" TEXT,
    "ghi_chu" TEXT,
    "nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kh_nguoi_lien_he_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "kh_nguoi_lien_he_id_khach_hang_fkey"
      FOREIGN KEY ("id_khach_hang") REFERENCES "kh_danh_sach_khach_hang"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "kh_nguoi_lien_he_id_khach_hang_idx"
  ON "kh_nguoi_lien_he"("id_khach_hang");

INSERT INTO "kh_nguoi_lien_he"
  ("ho_ten", "ngay_sinh", "chuc_vu", "so_dien_thoai", "email", "dia_chi", "ghi_chu", "id_khach_hang")
SELECT s.ho_ten, s.ngay_sinh, s.chuc_vu, s.sdt, s.email, s.dia_chi, s.ghi_chu, k.id
FROM (
  VALUES
    ('Nguyễn Văn An', '1985-03-12', 'Giám đốc', '0903111001', 'an.nguyen@minhphat.vn', NULL, 'Người quyết định chính', 'KH0001'),
    ('Trần Thị Bình', '1990', 'Kế toán trưởng', '0903111002', 'binh.tran@minhphat.vn', NULL, NULL, 'KH0001'),
    ('Lê Hoàng Cường', '1978-11-05', 'Phó giám đốc', '0912333001', 'cuong.le@dainam.vn', 'Đà Nẵng', NULL, 'KH0002'),
    ('Phạm Minh Đức', '1992', 'Thủ kho', '0987654001', NULL, 'Nha Trang', 'Liên hệ giao nhận', 'KH0003'),
    ('Hoàng Thị Em', '1988-07-20', 'Trưởng phòng mua hàng', '0938777001', 'em.hoang@ankhang.vn', NULL, NULL, 'KH0004'),
    ('Vũ Quốc Phong', '1975', 'Chủ DNTN', '0977123001', 'phong.vu@thanhcong.vn', 'Biên Hòa', NULL, 'KH0005'),
    ('Đặng Thu Hà', '1995-01-08', 'Sale Admin', '0909555001', 'ha.dang@mocviet.vn', NULL, NULL, 'KH0006'),
    ('Bùi Văn Khoa', '1980', 'Giám đốc SX', '0918999001', NULL, NULL, 'Tạm ít liên hệ', 'KH0007')
) AS s(ho_ten, ngay_sinh, chuc_vu, sdt, email, dia_chi, ghi_chu, ma_kh)
JOIN "kh_danh_sach_khach_hang" k ON k."ma_khach_hang" = s.ma_kh
WHERE NOT EXISTS (
  SELECT 1 FROM "kh_nguoi_lien_he" n
  WHERE n."id_khach_hang" = k.id AND n."ho_ten" = s.ho_ten AND n."so_dien_thoai" IS NOT DISTINCT FROM s.sdt
);
