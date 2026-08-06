-- Manual / emergency mirror of Prisma migration for phiếu hành chính.
-- Official path: Prisma Migrate. Do not run on production before deploy.
-- ma_phieu is a hardcoded type code (XN, NL, CT, NB, DC) — no master table.

CREATE TABLE IF NOT EXISTS "cong_luong_phieu_hanh_chinh" (
    "id" SERIAL NOT NULL,
    "ma_phieu" TEXT NOT NULL,
    "id_nhan_vien" INTEGER NOT NULL,
    "tu_ngay" DATE NOT NULL,
    "buoi_bat_dau" TEXT NOT NULL,
    "den_ngay" DATE NOT NULL,
    "buoi_ket_thuc" TEXT NOT NULL,
    "gio_bat_dau" TEXT,
    "gio_ket_thuc" TEXT,
    "ly_do" TEXT,
    "hinh_anh" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "trang_thai" TEXT NOT NULL DEFAULT 'cho_ql_duyet',
    "id_ql_duyet" INTEGER,
    "tg_ql_duyet" TIMESTAMPTZ(6),
    "ghi_chu_ql" TEXT,
    "id_hcns_duyet" INTEGER,
    "tg_hcns_duyet" TIMESTAMPTZ(6),
    "ghi_chu_hcns" TEXT,
    "ly_do_tu_choi" TEXT,
    "id_nguoi_tao" INTEGER,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tg_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cong_luong_phieu_hanh_chinh_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "cong_luong_phieu_hanh_chinh_ma_phieu_idx"
  ON "cong_luong_phieu_hanh_chinh"("ma_phieu");

CREATE INDEX IF NOT EXISTS "cong_luong_phieu_hanh_chinh_id_nhan_vien_idx"
  ON "cong_luong_phieu_hanh_chinh"("id_nhan_vien");

CREATE INDEX IF NOT EXISTS "cong_luong_phieu_hanh_chinh_trang_thai_idx"
  ON "cong_luong_phieu_hanh_chinh"("trang_thai");

CREATE INDEX IF NOT EXISTS "cong_luong_phieu_hanh_chinh_tu_ngay_idx"
  ON "cong_luong_phieu_hanh_chinh"("tu_ngay");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cong_luong_phieu_hanh_chinh_id_nhan_vien_fkey'
  ) THEN
    ALTER TABLE "cong_luong_phieu_hanh_chinh"
      ADD CONSTRAINT "cong_luong_phieu_hanh_chinh_id_nhan_vien_fkey"
      FOREIGN KEY ("id_nhan_vien") REFERENCES "var_nhan_vien"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "cong_luong_phieu_hanh_chinh"
  ("ma_phieu", "id_nhan_vien", "tu_ngay", "buoi_bat_dau", "den_ngay", "buoi_ket_thuc",
   "gio_bat_dau", "gio_ket_thuc", "ly_do", "hinh_anh", "trang_thai",
   "id_ql_duyet", "tg_ql_duyet", "ghi_chu_ql",
   "id_hcns_duyet", "tg_hcns_duyet", "ghi_chu_hcns", "ly_do_tu_choi", "id_nguoi_tao")
SELECT
  s.ma_phieu,
  nv.id,
  s.tu_ngay::date,
  s.buoi_bat_dau,
  s.den_ngay::date,
  s.buoi_ket_thuc,
  s.gio_bat_dau,
  s.gio_ket_thuc,
  s.ly_do,
  ARRAY[]::TEXT[],
  s.trang_thai,
  CASE WHEN s.trang_thai IN ('cho_hcns_duyet', 'da_duyet', 'tu_choi') AND s.has_ql THEN ql.id ELSE NULL END,
  CASE WHEN s.trang_thai IN ('cho_hcns_duyet', 'da_duyet', 'tu_choi') AND s.has_ql THEN CURRENT_TIMESTAMP ELSE NULL END,
  CASE WHEN s.trang_thai IN ('cho_hcns_duyet', 'da_duyet') AND s.has_ql THEN 'QL đồng ý' ELSE NULL END,
  CASE WHEN s.trang_thai = 'da_duyet' THEN hcns.id ELSE NULL END,
  CASE WHEN s.trang_thai = 'da_duyet' THEN CURRENT_TIMESTAMP ELSE NULL END,
  CASE WHEN s.trang_thai = 'da_duyet' THEN 'HCNS xác nhận' ELSE NULL END,
  CASE WHEN s.trang_thai = 'tu_choi' THEN 'Không đủ điều kiện' ELSE NULL END,
  nv.id
FROM (
  VALUES
    ('XN', 0, '2026-07-10', 'sang', '2026-07-10', 'chieu', NULL, NULL, 'Xin nghỉ việc riêng', 'cho_ql_duyet', false),
    ('CT', 0, '2026-07-12', 'sang', '2026-07-14', 'chieu', NULL, NULL, 'Công tác khách hàng miền Nam', 'cho_hcns_duyet', true),
    ('NB', 1, '2026-07-08', 'sang', '2026-07-09', 'sang', NULL, NULL, 'Nghỉ bệnh có giấy xác nhận', 'da_duyet', true),
    ('DC', 0, '2026-07-15', 'dem', '2026-07-15', 'dem', '22:00', '06:00', 'Điều chỉnh công ca đêm', 'cho_ql_duyet', false),
    ('XN', 1, '2026-06-20', 'chieu', '2026-06-22', 'sang', NULL, NULL, 'Xin nghỉ — trùng lịch', 'tu_choi', true),
    ('NL', 0, '2026-07-01', 'sang', '2026-07-01', 'chieu', NULL, NULL, 'Nghỉ lễ theo lịch công ty', 'da_duyet', true)
) AS s(ma_phieu, nv_offset, tu_ngay, buoi_bat_dau, den_ngay, buoi_ket_thuc, gio_bat_dau, gio_ket_thuc, ly_do, trang_thai, has_ql)
JOIN LATERAL (
  SELECT id FROM "var_nhan_vien" ORDER BY id ASC LIMIT 1 OFFSET s.nv_offset
) nv ON true
LEFT JOIN LATERAL (
  SELECT id FROM "var_nhan_vien" ORDER BY id ASC LIMIT 1 OFFSET 1
) ql ON true
LEFT JOIN LATERAL (
  SELECT id FROM "var_nhan_vien" ORDER BY id ASC LIMIT 1 OFFSET 2
) hcns ON true
WHERE NOT EXISTS (SELECT 1 FROM "cong_luong_phieu_hanh_chinh" LIMIT 1);
