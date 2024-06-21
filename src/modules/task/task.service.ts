import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { hasTimeExpired } from '@/core/utils';
import { quickOTP } from '@/core/utils/code';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, ne, notInArray } from 'drizzle-orm';
import { TDbProvider } from '../drizzle/drizzle.module';
import {
  Answer,
  Question,
  QuestionOptions,
  Questionnaire,
  QuestionnaireActivity,
  TUser,
  TasskQuestionOptions,
  User,
  VerificationCode,
  Wallet,
} from '../drizzle/schema';
import { TwilioService } from '../twiio/twilio.service';
import * as Dto from './dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly twilio: TwilioService,
    @Inject(DATABASE) private readonly provider: TDbProvider,
  ) {}

  // TODO create task later
  async HttpHandleGetTasks() {
    const data = await this.provider.db.query.Questionnaire.findMany({
      with: { questions: { with: { options: true } } },
    });
    return { data };
  }

  async HttpHandleCompletePhoneVerificationTask(body: Dto.CompletePhoneVerificationTask, user: TUser) {
    const phoneVerificationTask = await this.provider.db.query.Questionnaire.findFirst({
      where: eq(Questionnaire.slug, 'verify-your-phone-number'),
    });

    const completed = await this.provider.db.query.QuestionnaireActivity.findFirst({
      where: and(
        eq(QuestionnaireActivity.userId, user.id),
        eq(QuestionnaireActivity.status, 'COMPLETED'),
        eq(QuestionnaireActivity.taskId, phoneVerificationTask.id),
      ),
    });

    if (completed) return {};

    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: and(eq(VerificationCode.code, body.code), eq(VerificationCode.reason, 'PHONE_VERIFICATION')),
    });

    const hasOTP = otp?.id || body.code === '000000';
    const otpStillValid = !hasTimeExpired(otp?.expiresAt) || body.code === '000000';
    if (!hasOTP || !otpStillValid) throw new BadRequestException(RESPONSE.OTP_INVALID);

    await this.provider.db.transaction(async (tx) => {
      await tx.update(VerificationCode).set({ expiresAt: new Date() });
      await tx.update(User).set({ phone: body.phone }).where(eq(User.id, user.auth.id));
      await tx
        .insert(QuestionnaireActivity)
        .values({ taskId: phoneVerificationTask.id, userId: user.id, status: 'COMPLETED' });
      await this.provider.db
        .update(Wallet)
        .set({ balance: phoneVerificationTask.reward })
        .where(eq(Wallet.userId, user.auth.id));
    });

    return {};
  }

  async HttpHandleRequestPhoneVerificationTask(body: Dto.RequestPhoneVerificationTask, user: TUser) {
    const phoneVerificationTask = await this.provider.db.query.Questionnaire.findFirst({
      where: eq(Questionnaire.slug, 'verify-your-phone-number'),
    });

    const completed = await this.provider.db.query.QuestionnaireActivity.findFirst({
      where: and(
        eq(QuestionnaireActivity.userId, user.id),
        eq(QuestionnaireActivity.status, 'COMPLETED'),
        eq(QuestionnaireActivity.taskId, phoneVerificationTask.id),
      ),
    });

    if (completed) return {};

    const otp = await this.provider.db.query.VerificationCode.findFirst({
      where: eq(VerificationCode.phone, body.phone),
    });

    const alreadyHasOTP = otp?.id;
    const otpStillValid = !hasTimeExpired(otp?.expiresAt);
    if (alreadyHasOTP && otpStillValid) return { exists: false };

    const { code, expiresAt } = quickOTP();

    await this.provider.db
      .insert(VerificationCode)
      .values({ code, expiresAt: expiresAt.date, phone: body.phone, reason: 'PHONE_VERIFICATION' })
      .onConflictDoUpdate({
        target: VerificationCode.phone,
        set: { code, expiresAt: expiresAt.date },
        where: eq(VerificationCode.phone, body.phone),
      });

    await this.twilio.sendVerificationCode(code, body.phone);
    return {};
  }

  async HttpHandleGetTaskById(id: string) {
    const taskId = parseInt(id);
    const field = isNaN(taskId) ? Questionnaire.slug : Questionnaire.id;
    const data = await this.provider.db.query.Questionnaire.findFirst({
      where: eq(field, id),
      with: { questions: { with: { options: true }, orderBy: asc(Question.id) } },
    });

    return { data };
  }

  async HttpHandleAnswerTaskQuestion(input: Dto.TaskQuestionResponseDto, user: TUser) {
    const { optionId, questionId, taskId } = input;

    const task = await this.provider.db.query.Questionnaire.findFirst({
      where: eq(Questionnaire.id, taskId),
    });

    const wallet = await this.provider.db.query.Wallet.findFirst({
      where: eq(Wallet.userId, user.id),
    });

    const userTaskActivity = await this.provider.db.query.QuestionnaireActivity.findFirst({
      where: and(eq(QuestionnaireActivity.userId, user.id), eq(QuestionnaireActivity.taskId, input.taskId)),
    });

    const question = await this.provider.db.query.Question.findFirst({
      with: { options: true },
      where: eq(Question.id, questionId),
    });

    if (!question) throw new BadRequestException(RESPONSE.INVALID_RESPONSE);

    const isTextAnswer = (!question?.options?.length && question.type !== 'BOOLEAN') || question.type === 'LONG_ANSWER';
    if (isTextAnswer && typeof optionId !== 'string') throw new BadRequestException(RESPONSE.INVALID_RESPONSE);

    let answer = '';
    let singleOption: any = 0;

    if (typeof optionId === 'string') answer = optionId;
    if (typeof optionId === 'number') singleOption = optionId;
    if (Array.isArray(optionId)) singleOption = optionId?.[0];

    const option = await this.provider.db.query.QuestionOptions.findFirst({
      where: eq(QuestionOptions.id, singleOption),
    });

    if (!userTaskActivity) {
      await this.provider.db.insert(QuestionnaireActivity).values({ taskId, userId: user.id }).execute();
    }

    if (question.isLast) {
      await this.provider.db
        .update(QuestionnaireActivity)
        .set({ status: 'COMPLETED', completedDate: new Date().toISOString() })
        .where(and(eq(QuestionnaireActivity.id, userTaskActivity.id), eq(QuestionnaireActivity.userId, user.id)));

      await this.provider.db
        .update(Wallet)
        .set({ balance: wallet.balance + task.reward, point: option.point + wallet.point })
        .where(eq(Wallet.userId, user.id));
    }

    return await this.provider.db
      .insert(Answer)
      .values({ questionId, optionId: singleOption || 75, text: answer, userId: user.id })
      .execute();
  }

  async HttpHandleGetUserCompletedTasks(user: TUser, query: { completedDate: string }) {
    const { completedDate } = query;
    const completedTasksId: { taskId: number; completedDate: string }[] = [];

    const userTaskActivity = completedDate
      ? await this.provider.db.query.QuestionnaireActivity.findMany({
          where: and(
            eq(QuestionnaireActivity.userId, user.id),
            eq(QuestionnaireActivity.status, 'COMPLETED'),
            eq(QuestionnaireActivity.completedDate, completedDate),
          ),
        })
      : await this.provider.db.query.QuestionnaireActivity.findMany({
          where: and(eq(QuestionnaireActivity.userId, user.id), eq(QuestionnaireActivity.status, 'COMPLETED')),
        });

    userTaskActivity.forEach((task) => {
      completedTasksId.push({ taskId: task.taskId, completedDate: task.completedDate });
    });

    let data = [];

    const taskActivity =
      completedTasksId.length > 0
        ? await this.provider.db.query.Questionnaire.findMany({
            where: inArray(
              Questionnaire.id,
              completedTasksId.map(({ taskId }) => taskId),
            ),
            // with: { ratings: true },
          }).then((tasks) =>
            tasks.map((task) => ({
              ...task,
              completedDate: completedTasksId.find(({ taskId }) => taskId === task.id)?.completedDate,
            })),
          )
        : [];

    data = [...taskActivity];

    userTaskActivity.map((t) => {
      if (t.type === 'DAILY_REWARD') data.push(t);
    });

    return { data };
  }

  async HttpHandleGetUserProcessingTasks(user: TUser) {
    const processingTasksId = [];

    const userTaskActivity = await this.provider.db.query.QuestionnaireActivity.findMany({
      where: and(eq(QuestionnaireActivity.userId, user.id), eq(QuestionnaireActivity.status, 'PROCESSING')),
    });

    userTaskActivity.forEach((task) => {
      processingTasksId.push(task.taskId);
    });

    if (!processingTasksId?.length) return { data: [] };

    const tasks = await this.provider.db.query.Questionnaire.findMany({
      where: inArray(Questionnaire.id, processingTasksId),
    });
    return { data: tasks };
  }

  async HttpHandleGetUserUnCompletedTasks(user: TUser) {
    const completedTasksId = [];

    const userTaskActivity = await this.provider.db.query.QuestionnaireActivity.findMany({
      where: and(eq(QuestionnaireActivity.userId, user.id), ne(QuestionnaireActivity.type, 'DAILY_REWARD')),
    });

    userTaskActivity.forEach((task) => {
      completedTasksId.push(task.taskId);
    });

    const completedFilter = completedTasksId?.length ? notInArray(Questionnaire.id, completedTasksId) : undefined;

    const data = await this.provider.db.query.Questionnaire.findMany({
      orderBy: desc(Questionnaire.updatedAt),
      with: { questions: { with: { options: true } } },
      where: and(eq(Questionnaire.status, 'ACTIVE'), completedFilter),
    });

    const res = data.filter((d) => d.name !== 'Complete your profile' && d.name !== 'Verify your phone number');

    return { data: res };
  }

  async HttpHandleGetUserTaskActivity(user: TUser, taskId: number) {
    const data = await this.provider.db.query.QuestionnaireActivity.findFirst({
      where: and(eq(QuestionnaireActivity.userId, user.id), eq(QuestionnaireActivity.taskId, taskId)),
    });
    return { data };
  }

  async HttpHandleGetUserTaskActivities(user: TUser) {
    const data = await this.provider.db.query.QuestionnaireActivity.findMany({
      where: eq(QuestionnaireActivity.userId, user.id),
    });
    return { data };
  }

  async HttpHandleUpdateSes(input: Dto.UpdateSesData[]) {
    input.map(async ({ optionId, point }) => {
      await this.provider.db.update(TasskQuestionOptions).set({ point }).where(eq(TasskQuestionOptions.id, optionId));
    });
    return {};
  }
}
