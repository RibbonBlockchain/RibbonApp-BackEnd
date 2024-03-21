import { relations } from 'drizzle-orm';
import { serial, pgEnum, integer, varchar, pgSchema, timestamp, boolean } from 'drizzle-orm/pg-core';

export const ribbonSchema = pgSchema('ribbon');

export type TAuth = typeof Auth.$inferInsert;
export type TUser = typeof User.$inferSelect & {
  auth: TAuth;
};

export const RoleMap = ['ADMIN', 'SUPER_ADMIN', 'PATIENT'] as const;
export const RoleEnum = pgEnum('role', RoleMap);
export type TRole = (typeof RoleEnum.enumValues)[number];

export const UserStatusMap = ['ACTIVE', 'ONBOARDING'] as const;
export const UserStatusEnum = pgEnum('user_status', UserStatusMap);
export type TUserStatus = (typeof UserStatusEnum.enumValues)[number];

export const VerificationCodeReasonMap = ['SMS_ONBOARDING', 'PHONE_VERIFICATION'] as const;
export const VerificationCodeReasonEnum = pgEnum('verification_code_reason', VerificationCodeReasonMap);
export type TVerificationCodeReason = (typeof VerificationCodeReasonEnum.enumValues)[number];

export const TaskTypeMap = ['QUESTIONNAIRE', 'APP'] as const;
export const TaskTypeEnum = pgEnum('task_type', TaskTypeMap);
export type TTaskType = (typeof TaskTypeEnum.enumValues)[number];

export const QuestionTypeMap = ['BOOLEAN', 'MULTICHOICE', 'MULTISELECT', 'SHORT_ANSWER'] as const;
export const QuestionTypeEnum = pgEnum('question_type', QuestionTypeMap);
export type TQuestionType = (typeof QuestionTypeEnum.enumValues)[number];

export const UserTaskStatusMap = ['COMPLETED', 'PROCESSING'] as const;
export const UserTaskStatusEnum = pgEnum('user_task_status', UserTaskStatusMap);
export type TUserTaskStatusType = (typeof UserTaskStatusEnum.enumValues)[number];

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

export const Wallet = ribbonSchema.table('wallet', {
  id: serial('id').primaryKey(),
  balance: integer('balance').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const Task = ribbonSchema.table('task', {
  id: serial('id').primaryKey(),
  name: varchar('name'),
  description: varchar('description'),
  type: TaskTypeEnum('type').notNull(),
  reward: integer('reward').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const Question = ribbonSchema.table('question', {
  id: serial('id').primaryKey(),
  text: varchar('text'),
  type: QuestionTypeEnum('type').notNull(),
  isFirst: boolean('is_first').default(false),
  isLast: boolean('is_last').default(false),
  taskId: integer('task_id')
    .notNull()
    .references(() => Task.id),
});

export const Options = ribbonSchema.table('options', {
  id: serial('id').primaryKey(),
  point: integer('point').default(0),
  text: varchar('text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  questionId: integer('question_id')
    .notNull()
    .references(() => Question.id),
});

export const Answer = ribbonSchema.table('answer', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id')
    .notNull()
    .references(() => Question.id),
  optionId: integer('option_id')
    .notNull()
    .references(() => Options.id),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const UserTaskActivity = ribbonSchema.table('user_task_activity', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id')
    .notNull()
    .references(() => Task.id),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  status: UserTaskStatusEnum('status').default('PROCESSING'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const UserRelations = relations(User, ({ one, many }) => ({
  auth: one(Auth, { fields: [User.id], references: [Auth.userId] }),
  wallet: one(Wallet, { fields: [User.id], references: [Wallet.userId] }),
  activities: many(UserTaskActivity),
}));

export const TaskRelations = relations(Task, ({ many }) => ({
  questions: many(Question),
  activities: many(UserTaskActivity),
}));

export const QuestionRelations = relations(Question, ({ one, many }) => ({
  task: one(Task, { fields: [Question.taskId], references: [Task.id] }),
  options: many(Options),
}));

export const OptionsRelations = relations(Options, ({ one }) => ({
  question: one(Question, { fields: [Options.questionId], references: [Question.id] }),
}));

export const AnswerRelations = relations(Answer, ({ one }) => ({
  question: one(Question, { fields: [Answer.questionId], references: [Question.id] }),
  option: one(Options, { fields: [Answer.optionId], references: [Options.id] }),
  user: one(User, { fields: [Answer.userId], references: [User.id] }),
}));

export const UserTaskActivityRelations = relations(UserTaskActivity, ({ one }) => ({
  task: one(Task, { fields: [UserTaskActivity.taskId], references: [Task.id] }),
  user: one(User, { fields: [UserTaskActivity.userId], references: [User.id] }),
}));
