# Multi-stage Next.js 16 production image (standalone)
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
# Dùng Chromium của hệ thống (cài ở stage runner) — không tải bản Chrome riêng của puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=1
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --legacy-peer-deps

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUPPETEER_SKIP_DOWNLOAD=1
# ARG for Coolify / Dokploy / compose — NEXT_PUBLIC_* inlined at build time
ARG NEXT_PUBLIC_MEDIA_PROVIDER=uploads
ARG NEXT_PUBLIC_DATA_SOURCE=api
ARG NEXT_PUBLIC_API_BASE_URL=
ARG NEXT_PUBLIC_APP_URL=
ENV NEXT_PUBLIC_MEDIA_PROVIDER=$NEXT_PUBLIC_MEDIA_PROVIDER
ENV NEXT_PUBLIC_DATA_SOURCE=$NEXT_PUBLIC_DATA_SOURCE
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Chromium cho PDF hồ sơ nhân sự (`lib/pdf/render-html-to-pdf.ts`).
# `font-noto` là BẮT BUỘC — thiếu nó tiếng Việt có dấu render thành ô vuông trong PDF.
RUN apk add --no-cache \
  libc6-compat \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  font-noto
ENV PUPPETEER_SKIP_DOWNLOAD=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
# Font Inter nhúng cho PDF (`lib/print-document/server-fonts.ts` đọc bằng fs.readFile lúc
# render, KHÔNG qua import tĩnh) — Next file-tracing của standalone build không tự thấy,
# phải copy tay, nếu không thiếu là PDF sinh lỗi ENOENT lúc runtime.
COPY --from=builder /app/assets ./assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma CLI + engines for `migrate deploy` at container start (overlay after standalone)
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# start helpers — Dokploy `npm start` / entrypoint
COPY --from=builder /app/scripts/prisma-migrate-deploy.mjs ./scripts/prisma-migrate-deploy.mjs
COPY --from=builder /app/scripts/start-production.mjs ./scripts/start-production.mjs
COPY --from=builder /app/scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && chown -R nextjs:nodejs ./scripts ./docker-entrypoint.sh

# Default upload root (Coolify/Compose may mount a volume over this path)
RUN mkdir -p /data/uploads && chown nextjs:nodejs /data/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV UPLOAD_DIR=/data/uploads
ENTRYPOINT ["./docker-entrypoint.sh"]
