/**
 * Data source: production defaults to api (Postgres); mock for local/tests.
 * Override: NEXT_PUBLIC_DATA_SOURCE=mock | api
 */
export type DataSource = 'mock' | 'api';

function resolveDataSource(): DataSource {
  const raw = process.env.NEXT_PUBLIC_DATA_SOURCE;
  if (raw === 'mock' || raw === 'api') return raw;
  return process.env.NODE_ENV === 'production' ? 'api' : 'mock';
}

const DATA_SOURCE = resolveDataSource();

export function getDataSource(): DataSource {
  return DATA_SOURCE;
}

export function isMock(): boolean {
  return getDataSource() === 'mock';
}

export function isApi(): boolean {
  return getDataSource() === 'api';
}
