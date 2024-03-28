import { Pool } from 'pg';
import * as schema from './schema';
import { DATABASE } from '@/core/constants';
// import { isProduction } from '@/core/utils';
import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';

export type TDatabase = NodePgDatabase<typeof schema>;
export type TDbProvider = { db: TDatabase };

const DrizzleDatabaseProvider = {
  provide: DATABASE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const connectionString = configService.getOrThrow('DATABASE_URL');
    const pool = new Pool({
      connectionString,
      // ssl: isProduction ? { rejectUnauthorized: false } : undefined,
      ssl: { rejectUnauthorized: false },
    });

    const db = drizzle(pool, { schema });
    return { db };
  },
};

@Global()
@Module({ exports: [DATABASE], providers: [DrizzleDatabaseProvider] })
export class DrizzleModule {}
