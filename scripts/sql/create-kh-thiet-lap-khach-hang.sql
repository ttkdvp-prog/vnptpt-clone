-- Thiết lập khách hàng — nhóm + trạng thái
-- Official path: Prisma Migrate (prisma/migrations/20260717000000_thiet_lap_khach_hang).
-- This file is for manual/emergency apply.

CREATE TABLE IF NOT EXISTS "kh_thiet_lap_nhom_khach_hang" (
    "id" SERIAL NOT NULL,
    "ten_nhom" TEXT NOT NULL,
    "mo_ta" TEXT,
    "nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kh_thiet_lap_nhom_khach_hang_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "kh_thiet_lap_trang_thai" (
    "id" SERIAL NOT NULL,
    "ten_trang_thai" TEXT NOT NULL,
    "mo_ta" TEXT,
    "nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kh_thiet_lap_trang_thai_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "kh_thiet_lap_nhom_khach_hang_ten_nhom_key"
  ON "kh_thiet_lap_nhom_khach_hang"("ten_nhom");

CREATE UNIQUE INDEX IF NOT EXISTS "kh_thiet_lap_trang_thai_ten_trang_thai_key"
  ON "kh_thiet_lap_trang_thai"("ten_trang_thai");

INSERT INTO "kh_thiet_lap_nhom_khach_hang" ("ten_nhom", "mo_ta") VALUES
  ('VIP', 'Khách hàng chiến lược, ưu tiên chăm sóc cao'),
  ('Tiềm năng', 'Khách hàng đang trong giai đoạn tiếp cận'),
  ('Hiện hữu', 'Khách hàng đang giao dịch thường xuyên'),
  ('Ngừng hợp tác', 'Không còn quan hệ kinh doanh')
ON CONFLICT ("ten_nhom") DO NOTHING;

INSERT INTO "kh_thiet_lap_trang_thai" ("ten_trang_thai", "mo_ta") VALUES
  ('Mới', 'Vừa tạo hồ sơ, chưa bắt đầu chăm sóc'),
  ('Đang chăm sóc', 'Đang trong quy trình chăm sóc / bán hàng'),
  ('Chốt deal', 'Đã ký kết / phát sinh doanh số'),
  ('Tạm ngưng', 'Tạm dừng liên hệ, có thể tái kích hoạt')
ON CONFLICT ("ten_trang_thai") DO NOTHING;
