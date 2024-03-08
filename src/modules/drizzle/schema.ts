import { relations } from 'drizzle-orm';
import { serial, pgEnum, integer, varchar, pgSchema, timestamp } from 'drizzle-orm/pg-core';

export const ribbonSchema = pgSchema('ribbon');

export type TAuth = typeof Auth.$inferInsert;
export type TUser = typeof User.$inferSelect & {
  auth: TAuth;
};

export const RoleMap = ['PATIENT'] as const;
export const RoleEnum = pgEnum('role', RoleMap);
export type TRole = (typeof RoleEnum.enumValues)[number];

export const UserStatusMap = ['ACTIVE', 'ONBOARDING'] as const;
export const UserStatusEnum = pgEnum('user_status', UserStatusMap);
export type TUserStatus = (typeof UserStatusEnum.enumValues)[number];

export const VerificationCodeReasonMap = ['SMS_ONBOARDING'] as const;
export const VerificationCodeReasonEnum = pgEnum('verification_code_reason', VerificationCodeReasonMap);
export type TVerificationCodeReason = (typeof VerificationCodeReasonEnum.enumValues)[number];

export const User = ribbonSchema.table('user', {
  id: serial('id').primaryKey(),
  avatar: varchar('avatar'),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  email: varchar('email').unique(),
  phone: varchar('phone').unique(),
  role: RoleEnum('role').default('PATIENT').notNull(),
  status: UserStatusEnum('status').default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const Auth = ribbonSchema.table('auth', {
  id: serial('id').primaryKey(),
  pin: varchar('pin'),
  password: varchar('password'),
  accessToken: varchar('access_token'),
  refreshToken: varchar('refresh_token'),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const VerificationCode = ribbonSchema.table('verification_code', {
  id: serial('id').primaryKey(),
  code: varchar('code'),
  email: varchar('email').unique(),
  phone: varchar('phone').unique(),
  reason: VerificationCodeReasonEnum('reason'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const UserRelations = relations(User, ({ one }) => ({
  auth: one(Auth, { fields: [User.id], references: [Auth.userId] }),
}));
