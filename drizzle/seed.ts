import { Pool } from 'pg';
import * as env from 'dotenv';
import * as Argon2 from 'argon2';
import { isProduction } from '../src/core/utils';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Auth, User } from '../src/modules/drizzle/schema';

env.config();

if (!('DATABASE_URL' in process.env)) {
  throw new Error('DATABASE_URL not found on .env');
}

const admins = [{ email: 'superadmin@ribbon.com', password: 'password' }];

const main = async () => {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(client);

  await db.transaction(async (tx) => {
    admins.forEach(async (admin) => {
      const [user] = await tx
        .insert(User)
        .values({ email: admin.email, firstName: 'Super', lastName: 'Admin', role: 'SUPER_ADMIN', status: 'ACTIVE' })
        .returning();

      await tx.insert(Auth).values({ userId: user.id, password: await Argon2.hash(admin.password) });
    });
  });
};

main();
