-- Allow positions without a department; deleting a department clears the FK.
ALTER TABLE "var_chuc_vu" DROP CONSTRAINT IF EXISTS "var_chuc_vu_id_phong_ban_fkey";

ALTER TABLE "var_chuc_vu" ALTER COLUMN "id_phong_ban" DROP NOT NULL;

-- Heal orphan FKs that break Prisma required relations.
UPDATE "var_chuc_vu" AS cv
SET "id_phong_ban" = NULL
WHERE cv."id_phong_ban" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "var_phong_ban" pb WHERE pb."id" = cv."id_phong_ban"
  );

ALTER TABLE "var_chuc_vu"
  ADD CONSTRAINT "var_chuc_vu_id_phong_ban_fkey"
  FOREIGN KEY ("id_phong_ban") REFERENCES "var_phong_ban"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
