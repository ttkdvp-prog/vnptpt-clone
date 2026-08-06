-- Remove loại phiếu NP (Nghỉ phép năm); use XN (Xin nghỉ) only.
UPDATE "cong_luong_phieu_hanh_chinh"
SET "ma_phieu" = 'XN'
WHERE "ma_phieu" = 'NP';
