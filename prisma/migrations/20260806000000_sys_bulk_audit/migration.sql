-- Audit hành động bulk (xoá/đổi trạng thái/sửa hàng loạt/duyệt-từ chối theo lô).
-- actor_id dùng ON DELETE SET NULL: một nhân viên từng chạy bulk vẫn phải xoá
-- được, bảng audit không được biến thành thứ chặn xoá.

CREATE TABLE "sys_bulk_audit" (
    "id" BIGSERIAL NOT NULL,
    "module_key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "actor_id" INTEGER,
    "target_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "target_ids" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "failed_ids" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "payload" JSONB,
    "reason" TEXT,
    "error_sample" TEXT,
    "tg_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_bulk_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sys_bulk_audit_module_key_tg_tao_idx" ON "sys_bulk_audit"("module_key", "tg_tao");
CREATE INDEX "sys_bulk_audit_actor_id_tg_tao_idx" ON "sys_bulk_audit"("actor_id", "tg_tao");
CREATE INDEX "sys_bulk_audit_tg_tao_idx" ON "sys_bulk_audit"("tg_tao");

ALTER TABLE "sys_bulk_audit"
    ADD CONSTRAINT "sys_bulk_audit_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "var_nhan_vien"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
