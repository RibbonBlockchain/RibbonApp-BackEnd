import {
  Task,
  User,
  TUser,
  Answer,
  Wallet,
  Options,
  Question,
  TaskActivity,
  VerificationCode,
} from '../drizzle/schema';
import * as Dto from './dto';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { quickOTP } from '@/core/utils/code';
import { hasTimeExpired } from '@/core/utils';
import { TwilioService } from '../twiio/twilio.service';
import { TDbProvider } from '../drizzle/drizzle.module';
import { and, eq, inArray, ne, notInArray } from 'drizzle-orm';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class TaskService {
  constructor(
    private readonly twilio: TwilioService,
    @Inject(DATABASE) private readonly provider: TDbProvider,
  ) {}

  // TODO create task later
  async HttpHandleGetTasks() {
    const data = await this.provider.db.query.Task.findMany({ with: { questions: { with: { options: true } } } });
    return { data };
  }

  async HttpHandleCompletePhoneVerificationTask(body: Dto.CompletePhoneVerificationTask, user: TUser) {
    const phoneVerificationTask = await this.provider.db.query.Task.findFirst({
      where: eq(Task.slug, 'verify-your-phone-number'),
    });

    const completed = await this.provider.db.query.TaskActivity.findFirst({
      where: and(
        eq(TaskActivity.userId, user.id),
        eq(TaskActivity.status, 'COMPLETED'),
        eq(TaskActivity.taskId, phoneVerificationTask.id),
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
      await tx.insert(TaskActivity).values({ taskId: phoneVerificationTask.id, userId: user.id, status: 'COMPLETED' });
      await this.provider.db
        .update(Wallet)
        .set({ balance: phoneVerificationTask.reward })
        .where(eq(Wallet.userId, user.auth.id));
    });

    return {};
  }

  async HttpHandleRequestPhoneVerificationTask(body: Dto.RequestPhoneVerificationTask, user: TUser) {
    const phoneVerificationTask = await this.provider.db.query.Task.findFirst({
      where: eq(Task.slug, 'verify-your-phone-number'),
    });

    const completed = await this.provider.db.query.TaskActivity.findFirst({
      where: and(
        eq(TaskActivity.userId, user.id),
        eq(TaskActivity.status, 'COMPLETED'),
        eq(TaskActivity.taskId, phoneVerificationTask.id),
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
    const field = isNaN(taskId) ? Task.slug : Task.id;
    const data = await this.provider.db.query.Task.findFirst({
      where: eq(field, id),
      with: { questions: { with: { options: true } } },
    });

    return { data };
  }

  async HttpHandleAnswerTaskQuestion(input: Dto.TaskQuestionResponseDto, user: TUser) {
    const { optionId, questionId, taskId } = input;

    const task = await this.provider.db.query.Task.findFirst({
      where: eq(Task.id, taskId),
    });

    const wallet = await this.provider.db.query.Wallet.findFirst({
      where: eq(Wallet.userId, user.id),
    });

    const userTaskActivity = await this.provider.db.query.TaskActivity.findFirst({
      where: and(eq(TaskActivity.userId, user.id), eq(TaskActivity.taskId, input.taskId)),
    });

    const question = await this.provider.db.query.Question.findFirst({
      where: eq(Question.id, questionId),
    });

    const option = await this.provider.db.query.Options.findFirst({ where: eq(Options.id, optionId) });

    if (!userTaskActivity) {
      await this.provider.db.insert(TaskActivity).values({ taskId, userId: user.id }).execute();
    }

    if (question.isLast) {
      await this.provider.db
        .update(TaskActivity)
        .set({ status: 'COMPLETED', completedDate: new Date().toISOString() })
        .where(and(eq(TaskActivity.id, userTaskActivity.id), eq(TaskActivity.userId, user.id)));

      await this.provider.db
        .update(Wallet)
        .set({ balance: wallet.balance + task.reward })
        .where(eq(Wallet.userId, user.id));
    }

    await this.provider.db.update(Wallet).set({ point: option.point + wallet.point });

    return await this.provider.db.insert(Answer).values({ questionId, optionId, userId: user.id }).execute();
  }

  async HttpHandleGetUserCompletedTasks(user: TUser, query: { completedDate: string }) {
    const { completedDate } = query;
    const completedTasksId = [];

    const userTaskActivity = completedDate
      ? await this.provider.db.query.TaskActivity.findMany({
          where: and(
            eq(TaskActivity.userId, user.id),
            eq(TaskActivity.status, 'COMPLETED'),
            eq(TaskActivity.completedDate, completedDate),
          ),
        })
      : await this.provider.db.query.TaskActivity.findMany({
          where: and(eq(TaskActivity.userId, user.id), eq(TaskActivity.status, 'COMPLETED')),
        });

    userTaskActivity.forEach((task) => {
      completedTasksId.push(task.taskId);
    });

    const data =
      completedTasksId.length > 0
        ? await this.provider.db.query.Task.findMany({
            where: inArray(Task.id, completedTasksId),
            with: { ratings: true },
          })
        : [];

    return { data };
  }

  async HttpHandleGetUserProcessingTasks(user: TUser) {
    const processingTasksId = [];

    const userTaskActivity = await this.provider.db.query.TaskActivity.findMany({
      where: and(eq(TaskActivity.userId, user.id), eq(TaskActivity.status, 'PROCESSING')),
    });

    userTaskActivity.forEach((task) => {
      processingTasksId.push(task.taskId);
    });

    if (!processingTasksId?.length) return { data: [] };

    const tasks = await this.provider.db.query.Task.findMany({ where: inArray(Task.id, processingTasksId) });
    return { data: tasks };
  }

  async HttpHandleGetUserUnCompletedTasks(user: TUser) {
    const completedTasksId = [];

    const userTaskActivity = await this.provider.db.query.TaskActivity.findMany({
      where: and(eq(TaskActivity.userId, user.id), ne(TaskActivity.type, 'DAILY_REWARD')),
    });

    userTaskActivity.forEach((task) => {
      completedTasksId.push(task.taskId);
    });

    const data = await this.provider.db.query.Task.findMany({
      with: { questions: { with: { options: true } } },
      where: completedTasksId?.length ? notInArray(Task.id, completedTasksId) : null,
    });

    const res = data.filter((d) => d.name !== 'Complete your profile' && d.name !== 'Verify your phone number');

    return { data: res };
  }

  async HttpHandleGetUserTaskActivity(user: TUser, taskId: number) {
    const data = await this.provider.db.query.TaskActivity.findFirst({
      where: and(eq(TaskActivity.userId, user.id), eq(TaskActivity.taskId, taskId)),
    });
    return { data };
  }

  async HttpHandleGetUserTaskActivities(user: TUser) {
    const data = await this.provider.db.query.TaskActivity.findMany({
      where: eq(TaskActivity.userId, user.id),
    });
    return { data };
  }
}
