import { Hono } from 'hono';

const app = new Hono();

// Error Handling
app.onError((err, c) => {
  console.error(err);
  return c.text('Internal Server Error', 500);
});

// Allowed Origins
const ALLOWED_ORIGINS = new Set([
  'localhost',
  '127.0.0.1',
  'bookingms.mubihussain-te.workers.dev',
]);

// CORS Middleware
app.use('*', async (c, next) => {
  const { hostname } = new URL(c.req.url);

  if (ALLOWED_ORIGINS.has(hostname)) {
    c.res.headers.set('Access-Control-Allow-Origin', '*'); // Or set to hostname
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (c.req.method === 'OPTIONS') {
      return c.text('', 200); // Preflight response
    }

    await next();
  } else {
    return c.text(`Not allowed: ${hostname}`, 403);
  }
});

// Example Route
app.get('/', async (c) => {
  return c.json({
    message: 'Welcome to your Cloudflare Worker!',
  });
});


export default app;
