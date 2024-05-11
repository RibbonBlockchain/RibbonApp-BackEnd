import { Pool } from 'pg';
import * as env from 'dotenv';
import * as Argon2 from 'argon2';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createSlug, isProduction } from '../src/core/utils';
import { Auth, QuestionnaireCategory, Questionnaire, User } from '../src/modules/drizzle/schema';

env.config();

if (!('DATABASE_URL' in process.env)) {
  throw new Error('DATABASE_URL not found on .env');
}

const admins = [
  {
    pin: '0000',
    lastName: 'Admin',
    firstName: 'Super',
    phone: '+2349026503960',
    password: 'Password123?',
    status: 'ACTIVE' as const,
    role: 'SUPER_ADMIN' as const,
    email: 'superadmin@ribbon.com',
  },
];

const tasks = [
  { duration: 60, title: 'Verify your phone number', description: 'Verify your phone number', point: 15, reward: 3 },
  { duration: 60, title: 'Complete your profile', description: 'Complete your profile', point: 15, reward: 5 },
];

const questionnaireCategories = [
  { name: 'Health' },
  { name: 'Home' },
  { name: 'Environment' },
  { name: 'Migration' },
  { name: 'Relationship' },
  { name: 'Education' },
  { name: 'Employment' },
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
          slug: createSlug(task.title),
          description: task.description,
        })
        .onConflictDoNothing();
    });

    questionnaireCategories.forEach(async (cat) => {
      await tx
        .insert(QuestionnaireCategory)
        .values({ name: cat.name, slug: createSlug(cat.name) })
        .onConflictDoNothing();
    });

    admins.forEach(async (admin) => {
      const [user] = await tx
        .insert(User)
        .values({
          role: admin.role,
          phone: admin.phone,
          email: admin.email,
          status: admin.status,
          lastName: admin.lastName,
          firstName: admin.firstName,
        })
        .onConflictDoNothing()
        .returning();

      if (user?.id) {
        await tx
          .insert(Auth)
          .values({ userId: user.id, password: await Argon2.hash(admin.password), pin: await Argon2.hash(admin.pin) });
      }
    });
  });
};

main();
