-- Seed: ~15 nhân viên demo + phiếu xin nghỉ (XN)
-- Idempotent: skip theo tai_khoan / marker [SEED-XN]
-- Mật khẩu mặc định: 123456 (bcrypt)

-- 1) Chức vụ bổ sung (nếu chưa có)
INSERT INTO "var_chuc_vu" ("id_phong_ban", "ma_chuc_vu", "ten_chuc_vu", "cap_bac", "thu_tu", "trang_thai")
SELECT pb.id, v.ma, v.ten, v.cap, v.thu_tu, 'active'
FROM (
  VALUES
    ('NV-SX', 'Nhân viên sản xuất', 5, 10, 2),
    ('NV-KD', 'Nhân viên kinh doanh', 5, 11, 3),
    ('NV-HC', 'Nhân viên hành chính', 4, 12, 1)
) AS v(ma, ten, cap, thu_tu, pb_pick)
JOIN LATERAL (
  SELECT id FROM "var_phong_ban" ORDER BY id ASC LIMIT 1 OFFSET GREATEST(v.pb_pick - 1, 0)
) pb ON true
WHERE NOT EXISTS (
  SELECT 1 FROM "var_chuc_vu" cv WHERE cv."ma_chuc_vu" = v.ma
);

-- 2) Nhân viên
INSERT INTO "var_nhan_vien" (
  "ho_va_ten", "email", "email_ca_nhan", "so_dien_thoai", "gioi_tinh",
  "ngay_sinh", "so_cccd", "que_quan", "dan_toc", "ton_giao", "tinh_trang_hon_nhan", "quoc_tich",
  "ngay_vao_lam", "ngay_chinh_thuc", "ngay_nghi_viec", "ly_do_nghi",
  "so_tai_khoan", "ten_chu_tai_khoan", "ngan_hang", "chi_nhanh",
  "nguoi_lien_he_khan", "sdt_khan", "moi_quan_he",
  "so_so_bhxh", "so_bhyt", "ma_so_thue_ca_nhan",
  "trinh_do", "chuyen_nganh", "truong",
  "trang_thai", "id_chuc_vu", "id_phong_ban", "cap_bac",
  "tai_khoan", "mat_khau", "must_change_password", "nguoi_tao"
)
SELECT
  s.ho_va_ten,
  s.email,
  s.email_ca_nhan,
  s.so_dien_thoai,
  s.gioi_tinh,
  s.ngay_sinh::date,
  s.so_cccd,
  s.que_quan,
  'Kinh',
  'Không',
  s.tinh_trang_hon_nhan,
  'Việt Nam',
  s.ngay_vao_lam::date,
  s.ngay_chinh_thuc::date,
  s.ngay_nghi_viec::date,
  s.ly_do_nghi,
  s.so_tai_khoan,
  s.ho_va_ten,
  s.ngan_hang,
  'Chi nhánh TP.HCM',
  s.nguoi_lien_he_khan,
  s.sdt_khan,
  s.moi_quan_he,
  s.so_so_bhxh,
  s.so_bhyt,
  s.ma_so_thue_ca_nhan,
  s.trinh_do,
  s.chuyen_nganh,
  s.truong,
  s.trang_thai,
  cv.id,
  cv.id_phong_ban,
  cv.cap_bac,
  s.tai_khoan,
  '$2b$10$/H71ubgFGTzBbvPAsVP4u.T4SMjhml3J14Ga0hb0hv9gF8XkS1tXC',
  false,
  (SELECT id FROM "var_nhan_vien" ORDER BY id ASC LIMIT 1)
FROM (
  VALUES
    ('Nguyễn Văn An',    'seed.nvan',    'nvan@aht.vn',    'nvan.personal@gmail.com',    '0901000001', 'Nam', '1995-03-12', '079095000001', 'TP.HCM',     'Độc thân',    '2024-01-15', '2024-04-15', NULL,         NULL,           'ACTIVE',    'NV-SX', '1011000001', 'Vietcombank', 'Nguyễn Thị A',  '0902000001', 'Mẹ',       '7912345670', 'HS4010000001', '8010000001', 'Cao đẳng', 'Cơ khí',           'CĐ Kỹ thuật Cao Thắng'),
    ('Trần Thị Bình',    'seed.ttbinh',  'ttbinh@aht.vn',  'ttbinh.p@gmail.com',         '0901000002', 'Nữ',  '1998-07-22', '079098000002', 'Đồng Nai',   'Độc thân',    '2024-02-01', '2024-05-01', NULL,         NULL,           'ACTIVE',    'NV-KD', '1011000002', 'Techcombank', 'Trần Văn B',   '0902000002', 'Cha',      '7912345671', 'HS4010000002', '8010000002', 'Đại học',  'Kinh tế',          'ĐH Kinh tế TP.HCM'),
    ('Lê Hoàng Cường',   'seed.lhcuong', 'lhcuong@aht.vn', 'cuong.lh@gmail.com',         '0901000003', 'Nam', '2000-11-05', '079000000003', 'Bình Dương', 'Độc thân',    '2026-04-01', NULL,         NULL,         NULL,           'PROBATION', 'NV-SX', '1011000003', 'MB Bank',     'Lê Thị C',     '0902000003', 'Anh/Chị/Em','7912345672', 'HS4010000003', '8010000003', 'Trung cấp','Điện công nghiệp', 'TC Lạc Hồng'),
    ('Phạm Thị Dung',    'seed.ptdung',  'ptdung@aht.vn',  'dung.pt@gmail.com',          '0901000004', 'Nữ',  '1994-01-18', '079094000004', 'Long An',    'Đã kết hôn',  '2023-06-10', '2023-09-10', NULL,         NULL,           'ACTIVE',    'NV-HC', '1011000004', 'Agribank',    'Phạm Văn D',   '0902000004', 'Chồng',    '7912345673', 'HS4010000004', '8010000004', 'Đại học',  'Quản trị nhân sự', 'ĐH Lao động – Xã hội'),
    ('Hoàng Minh Đức',   'seed.hmduc',   'hmduc@aht.vn',   'duc.hm@gmail.com',           '0901000005', 'Nam', '1992-09-30', '079092000005', 'TP.HCM',     'Đã kết hôn',  '2022-03-01', '2022-06-01', NULL,         NULL,           'ACTIVE',    'TP-SX', '1011000005', 'VietinBank',  'Hoàng Thị E',  '0902000005', 'Vợ',       '7912345674', 'HS4010000005', '8010000005', 'Đại học',  'Kỹ thuật sản xuất', 'ĐH Bách Khoa TP.HCM'),
    ('Vũ Thị Hoa',       'seed.vthoa',   'vthoa@aht.vn',   'hoa.vt@gmail.com',           '0901000006', 'Nữ',  '1997-05-14', '079097000006', 'Tiền Giang', 'Độc thân',    '2024-08-20', '2024-11-20', NULL,         NULL,           'ACTIVE',    'NV-KD', '1011000006', 'ACB',         'Vũ Văn F',     '0902000006', 'Mẹ',       '7912345675', 'HS4010000006', '8010000006', 'Cao đẳng', 'Marketing',        'CĐ Kinh tế Đối ngoại'),
    ('Đặng Quốc Huy',    'seed.dqhuy',   'dqhuy@aht.vn',   'huy.dq@gmail.com',           '0901000007', 'Nam', '1996-12-08', '079096000007', 'TP.HCM',     'Độc thân',    '2023-01-10', '2023-04-10', NULL,         NULL,           'LEAVE',     'NV-SX', '1011000007', 'Vietcombank', 'Đặng Thị G',   '0902000007', 'Cha',      '7912345676', 'HS4010000007', '8010000007', 'THPT',     NULL,               NULL),
    ('Bùi Thị Lan',      'seed.btlan',   'btlan@aht.vn',   'lan.bt@gmail.com',           '0901000008', 'Nữ',  '1999-04-25', '079099000008', 'Cần Thơ',    'Độc thân',    '2025-01-06', '2025-04-06', NULL,         NULL,           'ACTIVE',    'NV-HC', '1011000008', 'BIDV',        'Bùi Văn H',    '0902000008', 'Anh/Chị/Em','7912345677', 'HS4010000008', '8010000008', 'Cao đẳng', 'Kế toán',          'CĐ Tài chính – Hải quan'),
    ('Ngô Văn Minh',     'seed.nvminh',  'nvminh@aht.vn',  'minh.nv@gmail.com',          '0901000009', 'Nam', '1993-08-16', '079093000009', 'Bà Rịa-VT',  'Đã kết hôn',  '2021-11-01', '2022-02-01', NULL,         NULL,           'ACTIVE',    'NV-SX', '1011000010', 'MB Bank',     'Ngô Thị I',    '0902000009', 'Vợ',       '7912345678', 'HS4010000009', '8010000009', 'Trung cấp','Hàn – cắt',        'TC Nguyễn Tất Thành'),
    ('Đỗ Thị Nga',       'seed.dtnga',   'dtnga@aht.vn',   'nga.dt@gmail.com',           '0901000010', 'Nữ',  '2001-02-28', '079001000010', 'TP.HCM',     'Độc thân',    '2026-05-12', NULL,         NULL,         NULL,           'PROBATION', 'NV-KD', '1011000011', 'Techcombank', 'Đỗ Văn K',     '0902000010', 'Mẹ',       '7912345679', 'HS4010000010', '8010000010', 'Đại học',  'Thương mại',       'ĐH Ngoại thương'),
    ('Phan Thanh Phong', 'seed.ptphong', 'ptphong@aht.vn', 'phong.pt@gmail.com',         '0901000011', 'Nam', '1990-06-03', '079090000011', 'Đồng Nai',   'Đã kết hôn',  '2020-09-15', '2020-12-15', NULL,         NULL,           'ACTIVE',    'TP-KD', '1011000012', 'Vietcombank', 'Phan Thị L',   '0902000011', 'Vợ',       '7912345680', 'HS4010000011', '8010000011', 'Thạc sĩ',  'Quản trị KD',      'ĐH Kinh tế TP.HCM'),
    ('Lương Thị Quỳnh',  'seed.ltquynh', 'ltquynh@aht.vn', 'quynh.lt@gmail.com',         '0901000012', 'Nữ',  '1995-10-19', '079095000012', 'An Giang',   'Độc thân',    '2024-03-18', '2024-06-18', NULL,         NULL,           'ACTIVE',    'NV-HC', '1011000013', 'Agribank',    'Lương Văn M',  '0902000012', 'Cha',      '7912345681', 'HS4010000012', '8010000012', 'Đại học',  'Luật',             'ĐH Luật TP.HCM'),
    ('Trịnh Văn Sơn',    'seed.tvson',   'tvson@aht.vn',   'son.tv@gmail.com',           '0901000013', 'Nam', '1988-12-01', '079088000013', 'TP.HCM',     'Đã kết hôn',  '2019-05-01', '2019-08-01', NULL,         NULL,           'ACTIVE',    'NV-SX', '1011000014', 'VietinBank',  'Trịnh Thị N',  '0902000013', 'Vợ',       '7912345682', 'HS4010000013', '8010000013', 'Cao đẳng', 'Tự động hóa',      'CĐ Công nghệ Thủ Đức'),
    ('Mai Thị Trang',    'seed.mttrang', 'mttrang@aht.vn', 'trang.mt@gmail.com',         '0901000014', 'Nữ',  '1991-07-07', '079091000014', 'Lâm Đồng',   'Đã kết hôn',  '2021-02-01', '2021-05-01', '2026-03-31', 'Hết hợp đồng', 'INACTIVE',  'NV-KD', '1011000015', 'ACB',         'Mai Văn O',    '0902000014', 'Chồng',    '7912345683', 'HS4010000014', '8010000014', 'Đại học',  'Ngôn ngữ Anh',     'ĐH Khoa học Xã hội & NV'),
    ('Hồ Văn Tùng',      'seed.hvtung',  'hvtung@aht.vn',  'tung.hv@gmail.com',          '0901000015', 'Nam', '1994-04-11', '079094000015', 'Bình Thuận', 'Độc thân',    '2023-09-01', '2023-12-01', NULL,         NULL,           'ACTIVE',    'NV-SX', '1011000016', 'BIDV',        'Hồ Thị P',     '0902000015', 'Anh/Chị/Em','7912345684', 'HS4010000015', '8010000015', 'Đại học',  'CNTT',             'ĐH Công nghiệp TP.HCM')
) AS s(
  ho_va_ten, tai_khoan, email, email_ca_nhan, so_dien_thoai, gioi_tinh, ngay_sinh, so_cccd, que_quan,
  tinh_trang_hon_nhan, ngay_vao_lam, ngay_chinh_thuc, ngay_nghi_viec, ly_do_nghi, trang_thai, ma_cv,
  so_tai_khoan, ngan_hang, nguoi_lien_he_khan, sdt_khan, moi_quan_he,
  so_so_bhxh, so_bhyt, ma_so_thue_ca_nhan, trinh_do, chuyen_nganh, truong
)
JOIN "var_chuc_vu" cv ON cv."ma_chuc_vu" = s.ma_cv
WHERE NOT EXISTS (
  SELECT 1 FROM "var_nhan_vien" nv WHERE nv."tai_khoan" = s.tai_khoan
);

-- 3) Phiếu xin nghỉ (XN) — ~15 phiếu, đủ trạng thái
INSERT INTO "cong_luong_phieu_hanh_chinh" (
  "ma_phieu", "id_nhan_vien", "tu_ngay", "buoi_bat_dau", "den_ngay", "buoi_ket_thuc",
  "gio_bat_dau", "gio_ket_thuc", "ly_do", "hinh_anh", "trang_thai",
  "id_ql_duyet", "tg_ql_duyet", "ghi_chu_ql",
  "id_hcns_duyet", "tg_hcns_duyet", "ghi_chu_hcns", "ly_do_tu_choi", "id_nguoi_tao"
)
SELECT
  'XN',
  nv.id,
  s.tu_ngay::date,
  s.buoi_bat_dau,
  s.den_ngay::date,
  s.buoi_ket_thuc,
  NULL,
  NULL,
  s.ly_do,
  ARRAY[]::TEXT[],
  s.trang_thai,
  CASE WHEN s.trang_thai IN ('cho_hcns_duyet', 'da_duyet', 'tu_choi') THEN ql.id ELSE NULL END,
  CASE WHEN s.trang_thai IN ('cho_hcns_duyet', 'da_duyet', 'tu_choi') THEN CURRENT_TIMESTAMP ELSE NULL END,
  CASE WHEN s.trang_thai IN ('cho_hcns_duyet', 'da_duyet') THEN 'QL đồng ý' ELSE NULL END,
  CASE WHEN s.trang_thai = 'da_duyet' THEN hcns.id ELSE NULL END,
  CASE WHEN s.trang_thai = 'da_duyet' THEN CURRENT_TIMESTAMP ELSE NULL END,
  CASE WHEN s.trang_thai = 'da_duyet' THEN 'HCNS xác nhận' ELSE NULL END,
  CASE WHEN s.trang_thai = 'tu_choi' THEN s.ly_do_tu_choi ELSE NULL END,
  nv.id
FROM (
  VALUES
    ('seed.nvan',    '2026-07-01', 'sang',  '2026-07-01', 'chieu', '[SEED-XN] Việc riêng gia đình',           'cho_ql_duyet',   NULL),
    ('seed.ttbinh',  '2026-07-03', 'sang',  '2026-07-04', 'chieu', '[SEED-XN] Nghỉ phép năm',                  'cho_hcns_duyet', NULL),
    ('seed.lhcuong', '2026-07-05', 'chieu', '2026-07-05', 'chieu', '[SEED-XN] Khám sức khỏe',                  'da_duyet',       NULL),
    ('seed.ptdung',  '2026-06-28', 'sang',  '2026-06-30', 'chieu', '[SEED-XN] Về quê cưới hỏi',                'da_duyet',       NULL),
    ('seed.hmduc',   '2026-07-08', 'sang',  '2026-07-08', 'sang',  '[SEED-XN] Đưa con đi khám',                'cho_ql_duyet',   NULL),
    ('seed.vthoa',   '2026-07-10', 'sang',  '2026-07-11', 'chieu', '[SEED-XN] Nghỉ việc riêng',                'cho_hcns_duyet', NULL),
    ('seed.dqhuy',   '2026-07-12', 'sang',  '2026-07-15', 'chieu', '[SEED-XN] Nghỉ phép dài ngày',             'da_duyet',       NULL),
    ('seed.btlan',   '2026-06-15', 'chieu', '2026-06-16', 'sang',  '[SEED-XN] Trùng lịch sản xuất',            'tu_choi',        'Không sắp xếp được nhân sự thay thế'),
    ('seed.nvminh',  '2026-07-14', 'sang',  '2026-07-14', 'chieu', '[SEED-XN] Việc ngân hàng',                 'cho_ql_duyet',   NULL),
    ('seed.dtnga',   '2026-07-16', 'sang',  '2026-07-16', 'sang',  '[SEED-XN] Làm giấy tờ hành chính',         'cho_ql_duyet',   NULL),
    ('seed.ptphong', '2026-07-02', 'sang',  '2026-07-03', 'chieu', '[SEED-XN] Công việc gia đình',             'da_duyet',       NULL),
    ('seed.ltquynh', '2026-07-18', 'chieu', '2026-07-18', 'chieu', '[SEED-XN] Nghỉ nửa ngày',                  'cho_hcns_duyet', NULL),
    ('seed.tvson',   '2026-06-10', 'sang',  '2026-06-12', 'chieu', '[SEED-XN] Nghỉ phép năm Q2',               'da_duyet',       NULL),
    ('seed.hvtung',  '2026-07-20', 'sang',  '2026-07-21', 'chieu', '[SEED-XN] Về quê thăm người thân',         'cho_ql_duyet',   NULL),
    ('seed.ttbinh',  '2026-05-20', 'sang',  '2026-05-21', 'chieu', '[SEED-XN] Nghỉ phép đã duyệt tháng 5',     'da_duyet',       NULL),
    ('seed.nvan',    '2026-05-05', 'sang',  '2026-05-05', 'chieu', '[SEED-XN] Xin nghỉ — từ chối do thiếu đơn','tu_choi',        'Thiếu giấy tờ đính kèm')
) AS s(tai_khoan, tu_ngay, buoi_bat_dau, den_ngay, buoi_ket_thuc, ly_do, trang_thai, ly_do_tu_choi)
JOIN "var_nhan_vien" nv ON nv."tai_khoan" = s.tai_khoan
LEFT JOIN LATERAL (
  SELECT id FROM "var_nhan_vien" ORDER BY id ASC LIMIT 1 OFFSET 0
) ql ON true
LEFT JOIN LATERAL (
  SELECT id FROM "var_nhan_vien" ORDER BY id ASC LIMIT 1 OFFSET 0
) hcns ON true
WHERE NOT EXISTS (
  SELECT 1 FROM "cong_luong_phieu_hanh_chinh" p
  WHERE p."ly_do" = s.ly_do AND p."ma_phieu" = 'XN'
);
