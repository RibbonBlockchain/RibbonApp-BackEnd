import * as env from 'dotenv';
import type { Config } from 'drizzle-kit';

env.config();

export default {
  driver: 'pg',
  out: './drizzle/migrations',
  schema: './src/modules/drizzle/schema.ts',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
} satisfies Config;
