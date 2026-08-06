#!/usr/bin/env node
/**
 * Dev entry: prisma generate → next dev, and auto-restart when schema.prisma changes.
 *
 * Without a process restart, Next keeps a stale PrismaClient in memory
 * (`prisma.<model>` is undefined → 500 on `.count` / `.findMany`).
 *
 * On macOS, `fs.watch` often fires spurious change/rename events (Spotlight,
 * xattr, editor indexing) without touching file contents — compare a content
 * fingerprint before restarting to avoid an infinite Next restart loop.
 */
import { spawn } from 'node:child_process';
import { readFileSync, statSync, watch } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const schemaPath = path.join(root, 'prisma', 'schema.prisma');
const port = process.env.PORT || '3000';

/** @type {import('node:child_process').ChildProcess | null} */
let nextProc = null;
let restarting = false;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let debounceTimer;
/** Last known schema fingerprint (mtimeMs:size:sha256). */
let lastSchemaFingerprint = '';

/**
 * @returns {string}
 */
function schemaFingerprint() {
  const { mtimeMs, size } = statSync(schemaPath);
  const hash = createHash('sha256').update(readFileSync(schemaPath)).digest('hex');
  return `${mtimeMs}:${size}:${hash}`;
}

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<void>}
 */
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} failed (${signal ?? code})`));
    });
  });
}

async function generate() {
  console.log('[dev] prisma generate…');
  await run('npx', ['prisma', 'generate']);
}

function startNext() {
  nextProc = spawn('npx', ['next', 'dev', '-p', port], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  nextProc.on('error', (err) => {
    console.error('[dev] next failed to start:', err);
    process.exit(1);
  });
  nextProc.on('exit', (code, signal) => {
    if (restarting) return;
    process.exit(code ?? (signal ? 1 : 0));
  });
}

/**
 * @param {NodeJS.Signals | undefined} signal
 */
function stopNext(signal = 'SIGTERM') {
  return new Promise((resolve) => {
    if (!nextProc || nextProc.killed) {
      resolve();
      return;
    }
    const proc = nextProc;
    const onExit = () => {
      clearTimeout(timer);
      resolve();
    };
    proc.once('exit', onExit);
    proc.kill(signal);
    const timer = setTimeout(() => {
      if (!proc.killed) proc.kill('SIGKILL');
      resolve();
    }, 2000);
  });
}

async function restartFromSchemaChange() {
  if (restarting) return;
  let fingerprint;
  try {
    fingerprint = schemaFingerprint();
  } catch {
    // Transient read during save/replace — wait for the next event.
    return;
  }
  if (fingerprint === lastSchemaFingerprint) return;

  restarting = true;
  lastSchemaFingerprint = fingerprint;
  console.log('\n[dev] prisma/schema.prisma changed → generate + restart Next\n');
  try {
    await stopNext();
    await generate();
    startNext();
  } catch (err) {
    console.error('[dev] restart failed:', err);
    process.exit(1);
  } finally {
    restarting = false;
  }
}

function onSignal(signal) {
  void (async () => {
    restarting = true;
    await stopNext(signal);
    process.exit(0);
  })();
}

process.on('SIGINT', () => onSignal('SIGINT'));
process.on('SIGTERM', () => onSignal('SIGTERM'));

try {
  lastSchemaFingerprint = schemaFingerprint();
  await generate();
  startNext();
  watch(schemaPath, { persistent: true }, (eventType) => {
    if (eventType !== 'change' && eventType !== 'rename') return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void restartFromSchemaChange();
    }, 600);
  });
  console.log('[dev] watching prisma/schema.prisma for changes');
} catch (err) {
  console.error('[dev] failed to start:', err);
  process.exit(1);
}
