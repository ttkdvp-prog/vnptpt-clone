import { createHonoRouteHandlers } from '@/lib/api/hono-next-handler';

export const { GET, POST, PATCH, PUT, DELETE, OPTIONS } = createHonoRouteHandlers();
