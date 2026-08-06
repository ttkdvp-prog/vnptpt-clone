/** Client/server env helpers — replaces Vite `import.meta.env`. */

export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getPublicEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === 'string' ? value : undefined;
}
