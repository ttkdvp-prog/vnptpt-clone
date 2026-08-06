-- Replace FK id_loai_phieu with hardcoded ma_phieu codes; drop master table.
-- Idempotent: safe to re-run after a partial / failed apply (P3009 recovery).

ALTER TABLE "cong_luong_phieu_hanh_chinh"
  ADD COLUMN IF NOT EXISTS "ma_phieu" TEXT;

-- Backfill from master only when both the lookup table and FK column still exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'cong_luong_nhom_phieu_hanh_chinh'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cong_luong_phieu_hanh_chinh'
      AND column_name = 'id_loai_phieu'
  ) THEN
    UPDATE "cong_luong_phieu_hanh_chinh" AS p
    SET "ma_phieu" = l."ma_phieu"
    FROM "cong_luong_nhom_phieu_hanh_chinh" AS l
    WHERE p."id_loai_phieu" = l."id"
      AND (p."ma_phieu" IS NULL OR p."ma_phieu" = '');
  END IF;
END $$;

-- Fallback for orphan / missing-lookup rows
UPDATE "cong_luong_phieu_hanh_chinh"
SET "ma_phieu" = 'XN'
WHERE "ma_phieu" IS NULL OR "ma_phieu" = '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cong_luong_phieu_hanh_chinh'
      AND column_name = 'ma_phieu'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "cong_luong_phieu_hanh_chinh"
      ALTER COLUMN "ma_phieu" SET NOT NULL;
  END IF;
END $$;

ALTER TABLE "cong_luong_phieu_hanh_chinh"
  DROP CONSTRAINT IF EXISTS "cong_luong_phieu_hanh_chinh_id_loai_phieu_fkey";

DROP INDEX IF EXISTS "cong_luong_phieu_hanh_chinh_id_loai_phieu_idx";

ALTER TABLE "cong_luong_phieu_hanh_chinh"
  DROP COLUMN IF EXISTS "id_loai_phieu";

CREATE INDEX IF NOT EXISTS "cong_luong_phieu_hanh_chinh_ma_phieu_idx"
  ON "cong_luong_phieu_hanh_chinh"("ma_phieu");

DROP TABLE IF EXISTS "cong_luong_nhom_phieu_hanh_chinh";
