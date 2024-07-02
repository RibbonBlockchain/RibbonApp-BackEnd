import { Pool } from 'pg';
import * as env from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createSlug, isProduction } from '../src/core/utils';
import { Questionnaire } from '../src/modules/drizzle/schema';

env.config();

if (!('DATABASE_URL' in process.env)) {
  throw new Error('DATABASE_URL not found on .env');
}

const tasks = [
  {
    point: 15,
    reward: 0.1,
    duration: 60,
    categoryId: 1,
    title: 'Verify your phone number',
    description: 'Verify your phone number',
  },
  {
    point: 15,
    reward: 0.1,
    duration: 60,
    categoryId: 1,
    title: 'Complete your profile',
    description: 'Complete your profile',
  },
];

const main = async () => {
  const client = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });

  const db = drizzle(client);

  await db.transaction(async (tx) => {
    tasks.forEach(async (task) => {
      await tx
        .insert(Questionnaire)
        .values({
          type: 'APP',
          name: task.title,
          point: task.point,
          reward: task.reward,
          duration: task.duration,
          categoryId: task.categoryId,
          slug: createSlug(task.title),
          description: task.description,
        })
        .onConflictDoNothing();
    });
  });
};

main();
