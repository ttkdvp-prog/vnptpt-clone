#!/usr/bin/env node
/**
 * Production start for Next.js `output: "standalone"`.
 * - Docker runner (cwd has server.js): `node server.js`
 * - Nixpacks / Dokploy without Dockerfile: `.next/standalone/server.js` (+ copy static/public)
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const cwd = process.cwd();
const port = process.env.PORT || '3000';

function runNode(scriptPath, options = {}) {
  const child = spawn(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port,
      HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
    },
    ...options,
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

const dockerServer = path.join(cwd, 'server.js');
if (existsSync(dockerServer)) {
  runNode(dockerServer);
} else if (existsSync(path.join(cwd, '.next', 'standalone', 'server.js'))) {
  const standaloneRoot = path.join(cwd, '.next', 'standalone');
  const standaloneServer = path.join(standaloneRoot, 'server.js');

  const staticSrc = path.join(cwd, '.next', 'static');
  const staticDest = path.join(standaloneRoot, '.next', 'static');
  if (existsSync(staticSrc)) {
    mkdirSync(path.dirname(staticDest), { recursive: true });
    cpSync(staticSrc, staticDest, { recursive: true });
  }

  const publicSrc = path.join(cwd, 'public');
  const publicDest = path.join(standaloneRoot, 'public');
  if (existsSync(publicSrc)) {
    cpSync(publicSrc, publicDest, { recursive: true });
  }

  // Font Inter nhúng cho PDF hồ sơ nhân sự (`lib/print-document/server-fonts.ts`) —
  // đọc bằng fs.readFile lúc render nên file-tracing của standalone build không tự thấy.
  const assetsSrc = path.join(cwd, 'assets');
  const assetsDest = path.join(standaloneRoot, 'assets');
  if (existsSync(assetsSrc)) {
    cpSync(assetsSrc, assetsDest, { recursive: true });
  }

  runNode(standaloneServer, { cwd: standaloneRoot });
} else {
  console.error(
    '[start] Standalone server not found. Expected ./server.js (Docker) or .next/standalone/server.js after build.\n' +
      'Use the project Dockerfile on Dokploy, or run: npm run build && npm start',
  );
  process.exit(1);
}
