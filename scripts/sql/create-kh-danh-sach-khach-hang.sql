-- Danh sách khách hàng — bảng + seed
-- Official path: Prisma Migrate (prisma/migrations/20260717010000_danh_sach_khach_hang).
-- This file is for manual/emergency apply.
-- Requires: kh_thiet_lap_nhom_khach_hang + kh_thiet_lap_trang_thai (đã seed).

CREATE TABLE IF NOT EXISTS "kh_danh_sach_khach_hang" (
    "id" SERIAL NOT NULL,
    "ma_khach_hang" TEXT NOT NULL,
    "ten_khach_hang" TEXT NOT NULL,
    "so_dien_thoai" TEXT,
    "dia_chi" TEXT,
    "ghi_chu" TEXT,
    "id_nhom" INTEGER NOT NULL,
    "id_trang_thai" INTEGER NOT NULL,
    "nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kh_danh_sach_khach_hang_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "kh_danh_sach_khach_hang_id_nhom_fkey"
      FOREIGN KEY ("id_nhom") REFERENCES "kh_thiet_lap_nhom_khach_hang"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kh_danh_sach_khach_hang_id_trang_thai_fkey"
      FOREIGN KEY ("id_trang_thai") REFERENCES "kh_thiet_lap_trang_thai"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "kh_danh_sach_khach_hang_ma_khach_hang_key"
  ON "kh_danh_sach_khach_hang"("ma_khach_hang");

CREATE INDEX IF NOT EXISTS "kh_danh_sach_khach_hang_id_nhom_idx"
  ON "kh_danh_sach_khach_hang"("id_nhom");

CREATE INDEX IF NOT EXISTS "kh_danh_sach_khach_hang_id_trang_thai_idx"
  ON "kh_danh_sach_khach_hang"("id_trang_thai");

INSERT INTO "kh_danh_sach_khach_hang"
  ("ma_khach_hang", "ten_khach_hang", "so_dien_thoai", "dia_chi", "ghi_chu", "id_nhom", "id_trang_thai")
SELECT s.ma, s.ten, s.sdt, s.dia_chi, s.ghi_chu, n.id, t.id
FROM (
  VALUES
    ('KH0001', 'Công ty TNHH Minh Phát', '0903111222', '12 Nguyễn Trãi, Q.1, TP.HCM', 'Khách hàng lâu năm, ưu tiên báo giá sớm', 'VIP', 'Đang chăm sóc'),
    ('KH0002', 'Công ty CP Xây dựng Đại Nam', '0912333444', '88 Lê Lợi, Đà Nẵng', NULL, 'VIP', 'Chốt deal'),
    ('KH0003', 'Cửa hàng VLXD Hòa Bình', '0987654321', '45 Trần Phú, Nha Trang', 'Giới thiệu qua đối tác', 'Tiềm năng', 'Mới'),
    ('KH0004', 'Công ty TNHH Thương mại An Khang', '0938777888', '203 Cách Mạng Tháng 8, Q.3, TP.HCM', NULL, 'Tiềm năng', 'Đang chăm sóc'),
    ('KH0005', 'DNTN Vận tải Thành Công', '0977123456', '15 Quốc lộ 51, Biên Hòa, Đồng Nai', 'Cần hợp đồng vận chuyển dài hạn', 'Hiện hữu', 'Chốt deal'),
    ('KH0006', 'Công ty CP Nội thất Mộc Việt', '0909555666', '67 Hoàng Văn Thụ, Phú Nhuận, TP.HCM', NULL, 'Hiện hữu', 'Đang chăm sóc'),
    ('KH0007', 'Công ty TNHH SX Bao bì Tân Á', '0918999000', 'KCN Tân Bình, TP.HCM', 'Tạm dừng đơn hàng do đổi kế hoạch', 'Ngừng hợp tác', 'Tạm ngưng')
) AS s(ma, ten, sdt, dia_chi, ghi_chu, ten_nhom, ten_trang_thai)
JOIN "kh_thiet_lap_nhom_khach_hang" n ON n."ten_nhom" = s.ten_nhom
JOIN "kh_thiet_lap_trang_thai" t ON t."ten_trang_thai" = s.ten_trang_thai
ON CONFLICT ("ma_khach_hang") DO NOTHING;
