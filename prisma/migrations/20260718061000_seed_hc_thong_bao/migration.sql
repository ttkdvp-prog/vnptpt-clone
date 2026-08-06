-- Seed: thông báo nội bộ — chỉ khi bảng trống và đã có chức vụ
INSERT INTO "hc_thong_bao" (
  "tg_dang",
  "tieu_de",
  "noi_dung",
  "id_chuc_vu",
  "id_nguoi_tao"
)
SELECT
  v.tg_dang,
  v.tieu_de,
  v.noi_dung,
  v.id_chuc_vu,
  (SELECT nv.id FROM "var_nhan_vien" nv ORDER BY nv.id LIMIT 1)
FROM (
  SELECT
    (now() - INTERVAL '2 day') AS tg_dang,
    'Thông báo họp định kỳ tháng này'::text AS tieu_de,
    'Toàn thể nhân viên vui lòng tham dự họp định kỳ vào sáng thứ 2 tuần tới tại phòng họp lớn. Nội dung: báo cáo tiến độ và kế hoạch tháng.'::text AS noi_dung,
    '{}'::INTEGER[] AS id_chuc_vu
  UNION ALL
  SELECT
    (now() - INTERVAL '1 day'),
    'Cập nhật quy định nội bộ HCNS',
    'Phòng Hành chính đã cập nhật quy định giờ làm việc và chấm công. Vui lòng đọc và thực hiện từ tuần sau.',
    ARRAY[(SELECT cv.id FROM "var_chuc_vu" cv ORDER BY cv.id LIMIT 1)]::INTEGER[]
  UNION ALL
  SELECT
    now(),
    'Nhắc nhở nộp báo cáo tuần',
    'Các bộ phận gửi báo cáo tuần trước 17:00 thứ 6. Mẫu báo cáo lấy tại module Tài liệu.',
    COALESCE(
      (SELECT array_agg(x.id ORDER BY x.id)
       FROM (SELECT cv.id FROM "var_chuc_vu" cv ORDER BY cv.id LIMIT 2) x),
      '{}'::INTEGER[]
    )
) AS v
WHERE NOT EXISTS (SELECT 1 FROM "hc_thong_bao")
  AND EXISTS (SELECT 1 FROM "var_chuc_vu");
