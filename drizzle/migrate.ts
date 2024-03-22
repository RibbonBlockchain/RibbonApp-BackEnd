import { Pool } from 'pg';
import * as env from 'dotenv';
import { isProduction } from '../src/core/utils';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

env.config();

if (!('DATABASE_URL' in process.env)) {
  throw new Error('DATABASE_URL not found on .env');
}

const pool = new Pool({
  max: 1,
  connectionString: process.env.DATABASE_URL,
  ssl: !isProduction ? { rejectUnauthorized: false } : undefined,
});

const db = drizzle(pool, { logger: true });

const main = async () => {
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
};

main();
