import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Call before using a model that may be missing from a stale PrismaClient
 * (schema changed + generate without restarting `npm run dev`).
 */
export function assertPrismaModel(
  delegate: unknown,
  modelName: string,
): asserts delegate is object {
  if (delegate == null) {
    throw new Error(
      `[prisma] Model "${modelName}" is undefined on the running client. ` +
        `Run \`npm run db:generate\` and restart \`npm run dev\` ` +
        `(or use the default \`npm run dev\` which regenerates and restarts on schema change).`,
    );
  }
}

/** @deprecated Use `prisma` — kept as alias during Hono migration */
export const sql = prisma;
