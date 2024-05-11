import {
  date,
  jsonb,
  serial,
  pgEnum,
  unique,
  integer,
  varchar,
  boolean,
  pgSchema,
  timestamp,
  doublePrecision,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const ribbonSchema = pgSchema('ribbon');

export type TAuth = typeof Auth.$inferInsert;
export type TUser = typeof User.$inferSelect & {
  auth: TAuth;
};

export const RoleMap = ['ADMIN', 'SUPER_ADMIN', 'PATIENT'] as const;
export const RoleEnum = pgEnum('role', RoleMap);
export type TRole = (typeof RoleEnum.enumValues)[number];

export const GenderMap = ['MALE', 'FEMALE', 'OTHER'] as const;
export const GenderEnum = pgEnum('gender', GenderMap);
export type TGender = (typeof GenderEnum.enumValues)[number];

export const UserStatusMap = ['ACTIVE', 'ONBOARDING'] as const;
export const UserStatusEnum = pgEnum('user_status', UserStatusMap);
export type TUserStatus = (typeof UserStatusEnum.enumValues)[number];

export const QuestionnaireStatusMap = ['ACTIVE', 'CLOSED'] as const;
export const QuestionnaireStatusEnum = pgEnum('questionnaire_status', QuestionnaireStatusMap);
export type TQuestionnaireStatus = (typeof QuestionnaireStatusEnum.enumValues)[number];

export const VerificationCodeReasonMap = ['FORGOT_PIN', 'SMS_ONBOARDING', 'PHONE_VERIFICATION'] as const;
export const VerificationCodeReasonEnum = pgEnum('verification_code_reason', VerificationCodeReasonMap);
export type TVerificationCodeReason = (typeof VerificationCodeReasonEnum.enumValues)[number];

export const TaskTypeMap = ['QUESTIONNAIRE', 'APP'] as const;
export const TaskTypeEnum = pgEnum('task_type', TaskTypeMap);
export type TTaskType = (typeof TaskTypeEnum.enumValues)[number];

export const QuestionTypeMap = [
  'BOOLEAN',
  'MULTICHOICE',
  'MULTISELECT',
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'CHECKBOX',
  'ROUND_BOX',
  'BUBBLE',
  'DATE',
  'TIME',
] as const;
export const QuestionTypeEnum = pgEnum('question_type', QuestionTypeMap);
export type TQuestionType = (typeof QuestionTypeEnum.enumValues)[number];

export const UserTaskStatusMap = ['COMPLETED', 'PROCESSING'] as const;
export const UserTaskStatusEnum = pgEnum('user_task_status', UserTaskStatusMap);
export type TUserTaskStatusType = (typeof UserTaskStatusEnum.enumValues)[number];

export const ActivityTypeMap = ['DAILY_REWARD', 'APP_TASK'] as const;
export const ActivityTypeEnum = pgEnum('activity_type', ActivityTypeMap);
export type TActivityType = (typeof ActivityTypeEnum.enumValues)[number];

export const User = ribbonSchema.table('user', {
  id: serial('id').primaryKey(),
  avatar: varchar('avatar'),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  otherNames: varchar('other_names'),
  email: varchar('email').unique(),
  phone: varchar('phone').unique(),
  gender: GenderEnum('gender'),
  dob: date('dob'),
  socials: jsonb('socals'),
  worldId: varchar('world_id'),
  role: RoleEnum('role').default('PATIENT').notNull(),
  status: UserStatusEnum('status').default('ACTIVE'),
  numberOfClaims: integer('numberOfClaims').default(0),
  lastClaimTime: timestamp('last_claim_time', { withTimezone: true }),
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
  point: integer('point').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const Questionnaire = ribbonSchema.table('questionniare', {
  id: serial('id').primaryKey(),
  image: varchar('image'),
  name: varchar('name'),
  slug: varchar('slug').unique(),
  description: varchar('description'),
  type: TaskTypeEnum('type').notNull(),
  point: integer('point').default(0),
  duration: integer('duration').default(60),
  status: QuestionnaireStatusEnum('status').default('ACTIVE'),
  reward: doublePrecision('reward').default(0.1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const Survey = ribbonSchema.table('survey', {
  id: serial('id').primaryKey(),
  image: varchar('image'),
  name: varchar('name'),
  slug: varchar('slug'),
  description: varchar('description'),
  reward: doublePrecision('reward').default(0.1),
  categoryId: integer('category_id')
    .notNull()
    .references(() => SurveyCategory.id),
  duration: integer('duration').default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const SurveyActivity = ribbonSchema.table('survey_activity', {
  id: serial('id').primaryKey(),
  surveyId: integer('survey_id').references(() => Survey.id),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  status: UserTaskStatusEnum('status').default('PROCESSING'),
  completedDate: date('completed_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const SurveyRating = ribbonSchema.table(
  'survey_rating',
  {
    id: serial('id').primaryKey(),
    rating: integer('rating').default(0),
    surveyId: integer('survey_id')
      .notNull()
      .references(() => Survey.id),
    userId: integer('user_id')
      .notNull()
      .references(() => User.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdSurveyId: unique('user_id_survey_id').on(t.userId, t.surveyId),
  }),
);

export const SurveyCategory = ribbonSchema.table('survey_category', {
  id: serial('id').primaryKey(),
  name: varchar('name').unique().notNull(),
  slug: varchar('slug').unique().notNull(),
  description: varchar('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const SurveyQuestion = ribbonSchema.table(
  'survey_question',
  {
    id: serial('id').primaryKey(),
    text: varchar('text'),
    type: QuestionTypeEnum('type').notNull(),
    isFirst: boolean('is_first').default(false),
    isLast: boolean('is_last').default(false),
    surveyId: integer('survey_id')
      .notNull()
      .references(() => Survey.id),
  },
  (t) => ({
    key: unique('survey_question_key').on(t.text, t.surveyId),
  }),
);

export const SurveyQuestionOptions = ribbonSchema.table('survey_question_options', {
  id: serial('id').primaryKey(),
  point: integer('point').default(0),
  text: varchar('text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  questionId: integer('question_id')
    .notNull()
    .references(() => SurveyQuestion.id),
});

export const SurveyQuestionAnswer = ribbonSchema.table('survey_question_answer', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id')
    .notNull()
    .references(() => SurveyQuestion.id),
  optionId: integer('option_id')
    .notNull()
    .references(() => SurveyQuestionOptions.id),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const Tassk = ribbonSchema.table('tassk', {
  id: serial('id').primaryKey(),
  image: varchar('image'),
  name: varchar('name'),
  slug: varchar('slug'),
  description: varchar('description'),
  reward: doublePrecision('reward').default(0.1),
  categoryId: integer('category_id')
    .notNull()
    .references(() => TasskCategory.id),
  duration: integer('duration').default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const TasskActivity = ribbonSchema.table('tassk_activity', {
  id: serial('id').primaryKey(),
  taskId: integer('tassk_id').references(() => Tassk.id),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  status: UserTaskStatusEnum('status').default('PROCESSING'),
  completedDate: date('completed_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const TasskRating = ribbonSchema.table(
  'task_rating',
  {
    id: serial('id').primaryKey(),
    rating: integer('rating').default(0),
    taskId: integer('task_id')
      .notNull()
      .references(() => Tassk.id),
    userId: integer('user_id')
      .notNull()
      .references(() => User.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdTaskId: unique('user_id_task_id').on(t.userId, t.taskId),
  }),
);

export const TasskCategory = ribbonSchema.table('task_category', {
  id: serial('id').primaryKey(),
  name: varchar('name').unique().notNull(),
  slug: varchar('slug').unique().notNull(),
  description: varchar('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const TasskQuestion = ribbonSchema.table(
  'task_question',
  {
    id: serial('id').primaryKey(),
    text: varchar('text'),
    type: QuestionTypeEnum('type').notNull(),
    isFirst: boolean('is_first').default(false),
    isLast: boolean('is_last').default(false),
    taskId: integer('task_id')
      .notNull()
      .references(() => Tassk.id),
  },
  (t) => ({
    key: unique('task_question_key').on(t.text, t.taskId),
  }),
);

export const TasskQuestionOptions = ribbonSchema.table('task_question_options', {
  id: serial('id').primaryKey(),
  point: integer('point').default(0),
  text: varchar('text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  questionId: integer('question_id')
    .notNull()
    .references(() => TasskQuestion.id),
});

export const TasskQuestionAnswer = ribbonSchema.table('task_question_answer', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id')
    .notNull()
    .references(() => TasskQuestion.id),
  response: varchar('response'),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const QuestionnaireRating = ribbonSchema.table(
  'questionnaire_rating',
  {
    id: serial('id').primaryKey(),
    rating: integer('rating').default(0),
    questionId: integer('questionnaire_id')
      .notNull()
      .references(() => Questionnaire.id),
    userId: integer('user_id')
      .notNull()
      .references(() => User.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdQuestionId: unique('user_id_question_id').on(t.userId, t.questionId),
  }),
);

export const Question = ribbonSchema.table(
  'question',
  {
    id: serial('id').primaryKey(),
    text: varchar('text'),
    type: QuestionTypeEnum('type').notNull(),
    isFirst: boolean('is_first').default(false),
    isLast: boolean('is_last').default(false),
    taskId: integer('task_id')
      .notNull()
      .references(() => Questionnaire.id),
  },
  (t) => ({
    key: unique('key').on(t.text, t.taskId),
  }),
);

export const QuestionnaireCategory = ribbonSchema.table('questionnaire_category', {
  id: serial('id').primaryKey(),
  name: varchar('name').unique().notNull(),
  slug: varchar('slug').unique().notNull(),
  description: varchar('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const QuestionOptions = ribbonSchema.table('question_options', {
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
    .references(() => QuestionOptions.id),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const QuestionnaireActivity = ribbonSchema.table('questionnaire_activity', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').references(() => Questionnaire.id),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  type: ActivityTypeEnum('type').default('APP_TASK'),
  status: UserTaskStatusEnum('status').default('PROCESSING'),
  completedDate: date('completed_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const Notification = ribbonSchema.table('notification', {
  id: serial('id').primaryKey(),
  title: varchar('title'),
  message: varchar('message'),
  userId: integer('user_id')
    .notNull()
    .references(() => User.id),
  isRead: boolean('isRead').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const UserRelations = relations(User, ({ one, many }) => ({
  auth: one(Auth, { fields: [User.id], references: [Auth.userId] }),
  wallet: one(Wallet, { fields: [User.id], references: [Wallet.userId] }),
  activities: many(QuestionnaireActivity),
  notifications: many(Notification),
}));

export const QuestionnaireRelations = relations(Questionnaire, ({ many }) => ({
  questions: many(Question),
  ratings: many(QuestionnaireCategory),
  activities: many(QuestionnaireActivity),
}));

export const SurveyRelations = relations(Survey, ({ one, many }) => ({
  ratings: many(SurveyRating),
  questions: many(SurveyQuestion),
  activities: many(SurveyActivity),
  category: one(SurveyCategory, { fields: [Survey.categoryId], references: [SurveyCategory.id] }),
}));

export const SurveyQuestionRelations = relations(SurveyQuestion, ({ one, many }) => ({
  options: many(SurveyQuestionOptions),
  survey: one(Survey, { fields: [SurveyQuestion.surveyId], references: [Survey.id] }),
}));

export const TasskRelations = relations(Tassk, ({ one, many }) => ({
  ratings: many(TasskRating),
  questions: many(TasskQuestion),
  activities: many(TasskActivity),
  category: one(TasskCategory, { fields: [Tassk.categoryId], references: [TasskCategory.id] }),
}));

export const TasskQuestionRelations = relations(TasskQuestion, ({ one, many }) => ({
  options: many(TasskQuestionOptions),
  survey: one(Tassk, { fields: [TasskQuestion.taskId], references: [Tassk.id] }),
}));

export const TasskAnswerRelations = relations(TasskQuestionAnswer, ({ one }) => ({
  question: one(TasskQuestion, { fields: [TasskQuestionAnswer.questionId], references: [TasskQuestion.id] }),
  user: one(User, { fields: [TasskQuestionAnswer.userId], references: [User.id] }),
}));

export const TasskActivityRelations = relations(TasskActivity, ({ one }) => ({
  survey: one(Tassk, { fields: [TasskActivity.taskId], references: [Tassk.id] }),
  user: one(User, { fields: [TasskActivity.userId], references: [User.id] }),
}));

export const SurveyAnswerRelations = relations(SurveyQuestionAnswer, ({ one }) => ({
  question: one(SurveyQuestion, { fields: [SurveyQuestionAnswer.questionId], references: [SurveyQuestion.id] }),
  option: one(SurveyQuestionOptions, {
    references: [SurveyQuestionOptions.id],
    fields: [SurveyQuestionAnswer.optionId],
  }),
  user: one(User, { fields: [SurveyQuestionAnswer.userId], references: [User.id] }),
}));

export const SurveyActivityRelations = relations(SurveyActivity, ({ one }) => ({
  survey: one(Survey, { fields: [SurveyActivity.surveyId], references: [Survey.id] }),
  user: one(User, { fields: [SurveyActivity.userId], references: [User.id] }),
}));

export const QuestionRelations = relations(Question, ({ one, many }) => ({
  options: many(QuestionOptions),
  task: one(Questionnaire, { fields: [Question.taskId], references: [Questionnaire.id] }),
}));

export const OptionsRelations = relations(QuestionOptions, ({ one }) => ({
  question: one(Question, { fields: [QuestionOptions.questionId], references: [Question.id] }),
}));

export const AnswerRelations = relations(Answer, ({ one }) => ({
  question: one(Question, { fields: [Answer.questionId], references: [Question.id] }),
  option: one(QuestionOptions, { fields: [Answer.optionId], references: [QuestionOptions.id] }),
  user: one(User, { fields: [Answer.userId], references: [User.id] }),
}));

export const QuestionniareActivityRelations = relations(QuestionnaireActivity, ({ one }) => ({
  task: one(Questionnaire, { fields: [QuestionnaireActivity.taskId], references: [Questionnaire.id] }),
  user: one(User, { fields: [QuestionnaireActivity.userId], references: [User.id] }),
}));

export const AuthRelations = relations(Auth, ({ one }) => ({
  user: one(User, { fields: [Auth.userId], references: [User.id] }),
}));

export const NotificationRelations = relations(Notification, ({ one }) => ({
  user: one(User, { fields: [Notification.userId], references: [User.id] }),
}));
