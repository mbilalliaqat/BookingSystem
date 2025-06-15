import app from './app';
import { getDbConnection } from './db';

export default {
  fetch: async (req: Request, env: Env, ctx: ExecutionContext) => {
    // Initialize DB and R2
    env.DB = getDbConnection(env.DATABASE_URL); // Neon DB connection

	globalThis.env = env;

	await import('./routes'); 

    // Pass the request to the Hono app
    return app.fetch(req, env, ctx);
  },
};
