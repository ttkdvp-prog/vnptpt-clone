import { pickCoercedIds } from '@/lib/db/map-entity-row';
import type { Employee } from './types';

export function mapEmployeeFromDb(row: Record<string, unknown>): Employee {
  const rest = pickCoercedIds(row, { nullable: [] });
  return { ...rest } as unknown as Employee;
}
