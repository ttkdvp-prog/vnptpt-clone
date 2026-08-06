#!/usr/bin/env node
/**
 * `prisma migrate deploy` with recovery for common production footguns:
 * - P3005: non-empty DB without migration history → baseline init once
 * - P3009 / P3018 + 42P07 (relation/index already exists): table was created via
 *   manual SQL / db push before Prisma Migrate — mark migration applied and retry
 * - P3009 stuck failed migration (other errors): mark rolled back once so a fixed
 *   / idempotent migration.sql can re-apply on the next deploy
 *
 * P3009 status messages do not re-print the original Postgres error; we load
 * `_prisma_migrations.logs` for the failed migration when deciding to recover.
 *
 * Other migrate errors still fail hard so the app does not start on a broken schema.
 * See docs/database.md.
 */
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const BASELINE_MIGRATION = '20260716000000_init';
const MAX_ALREADY_EXISTS_RECOVERIES = 10;
const MAX_ROLLBACK_RECOVERIES = 3;

function runPrisma(args) {
  return spawnSync('npx', ['prisma', ...args], {
    encoding: 'utf8',
    env: process.env,
    shell: process.platform === 'win32',
  });
}

function printResult(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

function combinedOutput(result) {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

function isP3005(combined) {
  return (
    combined.includes('P3005') ||
    combined.toLowerCase().includes('database schema is not empty')
  );
}

function isP3009(combined) {
  return (
    combined.includes('P3009') ||
    combined.toLowerCase().includes('failed migrations in the target database')
  );
}

function isP3018(combined) {
  return (
    combined.includes('P3018') ||
    combined.includes('A migration failed to apply')
  );
}

function textLooksLikeAlreadyExists(text) {
  return text.includes('42P07') || /already exists/i.test(text);
}

/**
 * Extract migration folder name from Prisma error output.
 * Supports P3009 ("The `name` migration … failed") and P3018 ("Migration name: …").
 */
function parseFailedMigrationName(combined) {
  const patterns = [
    /Migration name:\s*([0-9]{14}_[A-Za-z0-9_]+)/,
    /The `([0-9]{14}_[A-Za-z0-9_]+)` migration\b/,
    /migration_name[=:]"?([0-9]{14}_[A-Za-z0-9_]+)/i,
    /Applying migration `([0-9]{14}_[A-Za-z0-9_]+)`/,
  ];
  for (const re of patterns) {
    const m = re.exec(combined);
    if (m?.[1]) return m[1];
  }
  return null;
}

/** Load stored failure logs for a stuck/failed migration (P3009 case). */
async function loadFailedMigrationLogs(migrationName) {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(logs, '')::text AS logs
       FROM "_prisma_migrations"
       WHERE migration_name = $1
         AND finished_at IS NULL
         AND rolled_back_at IS NULL
       ORDER BY started_at DESC
       LIMIT 1`,
      migrationName,
    );
    const first = Array.isArray(rows) ? rows[0] : null;
    return typeof first?.logs === 'string' ? first.logs : '';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[prisma] could not read _prisma_migrations.logs: ${message}`);
    return '';
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * True when DB already matches the end state of drop_loai_phieu_hardcode
 * (failed mid-flight but schema was finished by hand / prior partial success).
 */
async function isDropLoaiPhieuHardcodeAlreadyDone() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'cong_luong_phieu_hanh_chinh'
            AND column_name = 'ma_phieu'
            AND is_nullable = 'NO'
        ) AS has_ma_phieu_nn,
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'cong_luong_phieu_hanh_chinh'
            AND column_name = 'id_loai_phieu'
        ) AS has_id_loai_phieu,
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'cong_luong_nhom_phieu_hanh_chinh'
        ) AS has_master
    `);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return false;
    return Boolean(row.has_ma_phieu_nn) && !row.has_id_loai_phieu && !row.has_master;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[prisma] could not inspect schema for hardcode recovery: ${message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function shouldRecoverAlreadyExists(combined) {
  if (textLooksLikeAlreadyExists(combined) && (isP3009(combined) || isP3018(combined))) {
    return true;
  }
  // P3009 often omits 42P07 from the CLI message — check stored logs.
  if (!isP3009(combined)) return false;
  const name = parseFailedMigrationName(combined);
  if (!name) return false;
  const logs = await loadFailedMigrationLogs(name);
  return textLooksLikeAlreadyExists(logs);
}

/**
 * P3009 with a stuck failed row: either schema already done → mark applied,
 * or roll back so an idempotent / fixed migration.sql can re-apply.
 */
async function shouldRecoverFailedMigration(combined) {
  if (!isP3009(combined)) return null;
  const name = parseFailedMigrationName(combined);
  if (!name) return null;

  if (
    name === '20260718070000_drop_loai_phieu_hardcode' &&
    (await isDropLoaiPhieuHardcodeAlreadyDone())
  ) {
    return { name, mode: 'applied' };
  }

  return { name, mode: 'rolled-back' };
}

function resolveApplied(migrationName, reason = 'already-exists') {
  console.warn(`[prisma] recovering (${reason}): mark applied ${migrationName}`);
  const resolve = runPrisma(['migrate', 'resolve', '--applied', migrationName]);
  printResult(resolve);
  return resolve.status === 0;
}

function resolveRolledBack(migrationName) {
  console.warn(`[prisma] recovering (failed): mark rolled-back ${migrationName}`);
  const resolve = runPrisma(['migrate', 'resolve', '--rolled-back', migrationName]);
  printResult(resolve);
  return resolve.status === 0;
}

function deployOnce() {
  const result = runPrisma(['migrate', 'deploy']);
  printResult(result);
  return result;
}

async function main() {
  let result = deployOnce();
  if (result.status === 0) {
    process.exit(0);
  }

  let combined = combinedOutput(result);

  if (isP3005(combined)) {
    console.warn(
      `[prisma] P3005: non-empty DB without migration history — baselining ${BASELINE_MIGRATION} once…`,
    );
    if (!resolveApplied(BASELINE_MIGRATION)) {
      console.error('[prisma] migrate resolve failed');
      process.exit(1);
    }
    result = deployOnce();
    if (result.status === 0) {
      process.exit(0);
    }
    combined = combinedOutput(result);
  }

  let recoveries = 0;
  while (
    result.status !== 0 &&
    recoveries < MAX_ALREADY_EXISTS_RECOVERIES &&
    (await shouldRecoverAlreadyExists(combined))
  ) {
    const name = parseFailedMigrationName(combined);
    if (!name) {
      console.error(
        '[prisma] already-exists failure but could not parse migration name; aborting',
      );
      process.exit(result.status ?? 1);
    }
    if (!resolveApplied(name)) {
      console.error(`[prisma] migrate resolve --applied ${name} failed`);
      process.exit(1);
    }
    recoveries += 1;
    result = deployOnce();
    if (result.status === 0) {
      process.exit(0);
    }
    combined = combinedOutput(result);
  }

  if (result.status !== 0 && (await shouldRecoverAlreadyExists(combined))) {
    console.error(
      `[prisma] exhausted ${MAX_ALREADY_EXISTS_RECOVERIES} already-exists recoveries; aborting`,
    );
    process.exit(result.status ?? 1);
  }

  let rollbacks = 0;
  while (result.status !== 0 && rollbacks < MAX_ROLLBACK_RECOVERIES) {
    const plan = await shouldRecoverFailedMigration(combined);
    if (!plan) break;

    const ok =
      plan.mode === 'applied'
        ? resolveApplied(plan.name, 'schema-already-done')
        : resolveRolledBack(plan.name);
    if (!ok) {
      console.error(
        `[prisma] migrate resolve --${plan.mode} ${plan.name} failed`,
      );
      process.exit(1);
    }

    rollbacks += 1;
    result = deployOnce();
    if (result.status === 0) {
      process.exit(0);
    }
    combined = combinedOutput(result);

    // Avoid re-rolling the same migration forever if it keeps failing.
    if (
      isP3009(combined) &&
      parseFailedMigrationName(combined) === plan.name &&
      plan.mode === 'rolled-back'
    ) {
      console.error(
        `[prisma] migration ${plan.name} still failing after rolled-back re-apply; aborting`,
      );
      process.exit(result.status ?? 1);
    }
  }

  process.exit(result.status ?? 1);
}

main().catch((err) => {
  console.error('[prisma] migrate deploy wrapper failed', err);
  process.exit(1);
});
