import { serve } from '@hono/node-server';
import { honoApp } from './hono-app';

const port = Number(process.env.API_PORT ?? 3001);

serve({ fetch: honoApp.fetch, port }, (info) => {
  console.log(`[api] listening on http://localhost:${info.port}`);
});
