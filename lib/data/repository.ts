/**
 * Repository interface for data access (mock in-memory).
 * Method names: insert / remove align with CRUD services.
 */
export interface RepositoryQueryOptions {
  orderBy?: string;
  ascending?: boolean;
  /** Limit number of rows */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Optional column projection hint (mock ignores). */
  select?: string;
  /** When true, include exact total with page results. */
  includeTotal?: boolean;
}

export interface RepositoryGetByIdOptions {
  select?: string;
}

/** Optional projection after insert/update (mock ignores). */
export interface RepositoryMutationOptions {
  returningSelect?: string;
}

export interface RepositoryListResult<T> {
  items: T[];
  total: number;
}

export interface IRepository<
  T extends { id: string },
  TCreate = Omit<T, 'id'>,
  TUpdate = Partial<T>,
> {
  count(): Promise<number>;
  getAll(options?: RepositoryQueryOptions): Promise<T[]>;
  /** One request: page items + total count. */
  getPage(options?: RepositoryQueryOptions): Promise<RepositoryListResult<T>>;
  getById(id: string, options?: RepositoryGetByIdOptions): Promise<T | null>;
  insert(data: TCreate, options?: RepositoryMutationOptions): Promise<T>;
  update(id: string, data: TUpdate, options?: RepositoryMutationOptions): Promise<T>;
  remove(ids: string[]): Promise<void>;
  upsert?(data: TCreate | TCreate[]): Promise<T[]>;
}
