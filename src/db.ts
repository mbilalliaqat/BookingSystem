import { Kysely, PostgresDialect } from 'kysely';
import { Pool, PoolConfig } from '@neondatabase/serverless';

export const getDbConnection = (connectionString: string) => {
  const connectionConfig: PoolConfig = {
    connectionString: connectionString,
  };

  return new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool(connectionConfig),
    }),
  });
};
