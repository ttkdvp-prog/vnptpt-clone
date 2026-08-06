import type { IRepository } from './repository';
import { MockRepository } from './mock-repository';

export interface CreateRepositoryConfig<T extends { id: string }> {
  tableName: string;
  mockData: T[];
  select?: string;
  delay?: number;
  /** Map raw DB row → domain entity (coerce bigint ids, unwrap embeds). */
  mapFromDb?: (row: Record<string, unknown>) => T;
}

/**
 * Factory: returns MockRepository (api mode uses lib/api + Prisma via services).
 */
export function createRepository<T extends { id: string }>(
  config: CreateRepositoryConfig<T>,
): IRepository<T> {
  return new MockRepository<T>(config.mockData, { delay: config.delay });
}
