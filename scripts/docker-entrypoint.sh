#!/bin/sh
set -eu

UPLOAD_DIR="${UPLOAD_DIR:-/data/uploads}"
mkdir -p "$UPLOAD_DIR" || true

echo "Running prisma migrate deploy..."
node ./scripts/prisma-migrate-deploy.mjs

echo "Starting Next.js (standalone)..."
# Prefer dedicated start helper (also used by `npm start` on Dokploy)
if [ -f ./scripts/start-production.mjs ]; then
  exec node ./scripts/start-production.mjs
fi
exec node server.js
