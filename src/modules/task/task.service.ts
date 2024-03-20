import { DATABASE } from '@/core/constants';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { TDbProvider } from '../drizzle/drizzle.module';
import { Answer, Question, TUser, Task, UserTaskActivity, Wallet } from '../drizzle/schema';
import { TaskQuestionResponseDto } from './dto/request';

@Injectable()
export class TaskService {
  constructor(@Inject(DATABASE) private readonly provider: TDbProvider) {}

  // TODO create task later

  async HttpHandleGetTasks() {
    const data = await this.provider.db.query.Task.findMany({
      with: {
        questions: {
          with: {
            options: true,
          },
        },
      },
    });
    return { data };
  }

  async HttpHandleGetTaskById(id: number) {
    const data = await this.provider.db.query.Task.findFirst({
      where: eq(Task.id, id),
      with: {
        questions: {
          with: {
            options: true,
          },
        },
      },
    });
    return { data };
  }

  async HttpHandleAnswerTaskQuestion(input: TaskQuestionResponseDto, user: TUser) {
    const { optionId, questionId, taskId } = input;

    const task = await this.provider.db.query.Task.findFirst({
      where: eq(Task.id, taskId),
    });

    const wallet = await this.provider.db.query.Wallet.findFirst({
      where: eq(Wallet.userId, user.id),
    });

    const userTaskActivity = await this.provider.db.query.UserTaskActivity.findFirst({
      where: and(eq(UserTaskActivity.userId, user.id), eq(UserTaskActivity.taskId, input.taskId)),
    });

    const question = await this.provider.db.query.Question.findFirst({
      where: eq(Question.id, questionId),
    });

    if (!userTaskActivity) {
      await this.provider.db.insert(UserTaskActivity).values({ taskId, userId: user.id }).execute();
    }

    if (question.isLast) {
      await this.provider.db
        .update(UserTaskActivity)
        .set({ status: 'COMPLETED' })
        .where(and(eq(UserTaskActivity.id, userTaskActivity.id), eq(UserTaskActivity.userId, user.id)));
      await this.provider.db
        .update(Wallet)
        .set({ balance: wallet.balance + task.reward })
        .where(eq(Wallet.userId, user.id));
    }

    return await this.provider.db.insert(Answer).values({ questionId, optionId, userId: user.id }).execute();
  }

  async HttpHandleGetUserCompletedTasks(user: TUser) {
    const completedTasksId = [];

    const userTaskActivity = await this.provider.db.query.UserTaskActivity.findMany({
      where: and(eq(UserTaskActivity.userId, user.id), eq(UserTaskActivity.status, 'COMPLETED')),
    });

    userTaskActivity.forEach((task) => {
      completedTasksId.push(task.taskId);
    });

    return await this.provider.db.query.Task.findMany({ where: inArray(Task.id, completedTasksId) });
  }

  async HttpHandleGetUserProcessingTasks(user: TUser) {
    const processingTasksId = [];

    const userTaskActivity = await this.provider.db.query.UserTaskActivity.findMany({
      where: and(eq(UserTaskActivity.userId, user.id), eq(UserTaskActivity.status, 'PROCESSING')),
    });

    userTaskActivity.forEach((task) => {
      processingTasksId.push(task.taskId);
    });

    const tasks = await this.provider.db.query.Task.findMany({ where: inArray(Task.id, processingTasksId) });
    return { data: tasks };
  }

  async HttpHandleGetUserUnCompletedTasks(user: TUser) {
    const completedTasksId = [];

    const userTaskActivity = await this.provider.db.query.UserTaskActivity.findMany({
      where: and(eq(UserTaskActivity.userId, user.id), eq(UserTaskActivity.status, 'COMPLETED')),
    });

    userTaskActivity.forEach((task) => {
      completedTasksId.push(task.taskId);
    });

    const tasks = await this.provider.db.query.Task.findMany();

    const data = tasks.filter((task) => {
      return !completedTasksId.includes(task.id);
    });

    return { data };
  }

  async HttpHandleGetUserTaskActivity(user: TUser, taskId: number) {
    const data = await this.provider.db.query.UserTaskActivity.findFirst({
      where: and(eq(UserTaskActivity.userId, user.id), eq(UserTaskActivity.taskId, taskId)),
    });
    return { data };
  }

  async HttpHandleGetUserTaskActivities(user: TUser) {
    const data = await this.provider.db.query.UserTaskActivity.findMany({
      where: eq(UserTaskActivity.userId, user.id),
    });
    return { data };
  }
}
