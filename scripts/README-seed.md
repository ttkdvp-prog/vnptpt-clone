# Seed / SQL scripts (legacy)

Schema chính thức đi qua **Prisma Migrate** — xem [`docs/database.md`](../docs/database.md).

Các file trong `scripts/sql/` và `apply-sql-migration.mjs` là **deprecated** (đã gộp vào baseline `prisma/migrations/20260716000000_init`). Chỉ giữ để tham khảo / emergency.

## Bootstrap schema (chuẩn)

```bash
docker compose up postgres -d
npm run db:migrate:deploy
```

## Seed dữ liệu mẫu

Nếu còn script seed riêng trong `scripts/`, chạy sau khi migrate đã apply.
