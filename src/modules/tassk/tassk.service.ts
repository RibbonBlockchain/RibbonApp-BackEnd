import {
  Tassk,
  TUser,
  TasskRating,
  TasskActivity,
  TasskCategory,
  TasskQuestion,
  TasskQuestionOptions,
  Wallet,
  TasskQuestionAnswer,
} from '../drizzle/schema';
import fs from 'fs';
import * as Dto from './dto';
import { and, asc, desc, eq, ilike, inArray, notInArray, or, sql } from 'drizzle-orm';
import { RESPONSE } from '@/core/responses';
import { DATABASE } from '@/core/constants';
import { generatePagination, getPage } from '@/core/utils/page';
import excelToJson from 'convert-excel-to-json';
import { generateCode } from '@/core/utils/code';
import { TDbProvider } from '../drizzle/drizzle.module';
import { createSlug, getRewardValue } from '@/core/utils';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class TasskService {
  constructor(@Inject(DATABASE) private readonly provider: TDbProvider) {}

  async HttpHandleGetTasskCategories({ q, page, pageSize }: Dto.GetTasskCategoriesQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const queryFilter = q
      ? or(
          ilike(TasskCategory.name, searchQuery),
          ilike(TasskCategory.slug, searchQuery),
          ilike(TasskCategory.description, searchQuery),
        )
      : undefined;

    return await this.provider.db.transaction(async (tx) => {
      const data = await tx.query.TasskCategory.findMany({
        limit,
        offset,
        where: queryFilter,
        orderBy: desc(TasskCategory.updatedAt),
      });

      const [{ total }] = await tx
        .select({ total: sql<number>`cast(count(${TasskCategory.id}) as int)` })
        .from(TasskCategory)
        .where(queryFilter);

      return { data, pagination: generatePagination(page, pageSize, total) };
    });
  }

  async HttpHandleGetTaskSummary() {
    return await this.provider.db.transaction(async (tx) => {
      const [{ active }] = await tx
        .select({ active: sql<number>`cast(count(${Tassk.id}) as int)` })
        .from(Tassk)
        .where(eq(Tassk.status, 'ACTIVE'));

      const [{ closed }] = await tx
        .select({ closed: sql<number>`cast(count(${Tassk.id}) as int)` })
        .from(Tassk)
        .where(eq(Tassk.status, 'CLOSED'));

      return { count: { active, closed } };
    });
  }

  async HttpHandleUpdateTaskStatus(body: Dto.UpdateTaskStatusBody) {
    await this.provider.db.update(Tassk).set({ status: body.status }).where(eq(Tassk.id, body.id));
    return {};
  }

  async HttpHandleCreateTasskCategory(body: Dto.CreateTasskCategoryBody) {
    await this.provider.db
      .insert(TasskCategory)
      .values({ name: body.name, slug: createSlug(body.name), description: body.description })
      .onConflictDoNothing();

    return {};
  }

  async HttphandleGetTassks({ q, page, status, pageSize }: Dto.GetAllTasskQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const statusFilter = status ? eq(Tassk.status, status) : undefined;

    const queryFilter = q
      ? or(ilike(Tassk.name, searchQuery), ilike(Tassk.slug, searchQuery), ilike(Tassk.description, searchQuery))
      : undefined;

    return await this.provider.db.transaction(async (tx) => {
      const data = await tx.query.Tassk.findMany({
        limit,
        offset,
        orderBy: desc(Tassk.updatedAt),
        where: and(statusFilter, queryFilter),
        with: { questions: { limit: 1 }, activities: { limit: 1 }, category: true },
        extras: {
          totalResponses:
            sql<number>`(SELECT CAST(COUNT(*) as int) FROM ${TasskActivity} WHERE ${Tassk.id} = tassk_activity.tassk_id)`.as(
              'responses',
            ),
          totalQuestions:
            sql<number>`(SELECT CAST(COUNT(*) as int) FROM ${TasskQuestion} WHERE ${Tassk.id} = task_question.task_id)`.as(
              'totalQuestions',
            ),
        },
      });

      const [{ total }] = await tx
        .select({ total: sql<number>`cast(count(${Tassk.id}) as int)` })
        .from(Tassk)
        .where(and(statusFilter, queryFilter));

      return { data, pagination: generatePagination(page, pageSize, total) };
    });
  }

  async HttphandleAdminGetTasskById(id: number) {
    return await this.provider.db.query.Tassk.findFirst({
      where: eq(Tassk.id, id),
      with: { questions: true, category: true },
    });
  }

  async HttpHandleRateTassk(body: Dto.RateTasskBody, user: TUser) {
    const activity = await this.provider.db.query.TasskActivity.findFirst({
      with: { survey: { columns: { id: true } } },
      where: and(
        eq(TasskActivity.userId, user.id),
        eq(TasskActivity.status, 'COMPLETED'),
        eq(TasskActivity.taskId, body.taskId),
      ),
    });

    if (!activity?.id) throw new BadRequestException(RESPONSE.COMPLETE_QUESTIONNAIRE_TO_CONTINUE);

    const rating = Math.max(0, Math.min(body.rating, 5));

    await this.provider.db
      .insert(TasskRating)
      .values({ taskId: activity.taskId, userId: user.id, rating })
      .onConflictDoNothing();

    return {};
  }

  async HttpHandleAddTassk(body: Dto.AddTasskBody) {
    await this.provider.db.transaction(async (tx) => {
      let categoryName = '';

      if (body.categoryId) {
        const category = await tx.query.TasskCategory.findFirst({
          where: eq(TasskCategory.id, body.categoryId),
        });
        categoryName = category.name;
      }

      if (body.category) {
        let [category] = await tx
          .insert(TasskCategory)
          .values({ name: body.category, slug: createSlug(body.category) })
          .onConflictDoNothing()
          .returning();

        if (!category)
          category = await tx.query.TasskCategory.findFirst({
            where: eq(TasskCategory.name, body.category),
          });

        categoryName = category.name;
        body.categoryId = category.id;
      }

      if (!categoryName) throw new BadRequestException('Category not found');

      const code = generateCode();
      const slug = createSlug(categoryName + ' ' + code);

      const [survey] = await tx
        .insert(Tassk)
        .values({
          slug,
          description: '',
          name: categoryName,
          reward: body.reward,
          categoryId: body.categoryId,
        })
        .returning({ id: Tassk.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          const [question] = await tx
            .insert(TasskQuestion)
            .values({
              type: data.type,
              taskId: survey.id,
              text: data.question,
              isFirst: index === 0,
              isLast: index === body.questions.length - 1,
            })
            .returning({ id: TasskQuestion.id })
            .onConflictDoUpdate({
              target: [TasskQuestion.text, TasskQuestion.taskId],
              set: {
                type: data.type,
                taskId: survey.id,
                text: data.question,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              },
            });

          await Promise.all(
            data?.options?.map(async (option) => {
              await tx
                .insert(TasskQuestionOptions)
                .values({ questionId: question.id, point: option.point, text: option.value });
            }),
          );
        }),
      );
    });

    return {};
  }

  async HttpHandleUploadTassks(file: Express.Multer.File) {
    const sheets = excelToJson({
      sourceFile: file.path,
      columnToKey: { '*': '{{columnHeader}}' },
    });

    await Promise.all(
      Object.keys(sheets).map(async (category) => {
        let taskId = 0;
        const questions = sheets[category];

        let [cat] = await this.provider.db
          .insert(TasskCategory)
          .values({ name: category, slug: createSlug(category), description: '' })
          .onConflictDoNothing()
          .returning();

        if (!cat) {
          cat = await this.provider.db.query.TasskCategory.findFirst({
            where: eq(TasskCategory.slug, createSlug(category)),
          });
        }

        for (const question of questions) {
          if (question.id === 'id') {
            const name = `${category} ${generateCode()}`.trim();
            const reward = getRewardValue(Object.keys(question)) || 0;

            const [res] = await this.provider.db
              .insert(Tassk)
              .values({ categoryId: cat.id, name: category, description: '', slug: createSlug(name), reward })
              .returning({ id: Tassk.id });

            taskId = res?.id;
          } else {
            const isFirst = question.id === 1;
            const isLast = question.id === questions?.length - 1;

            const [res] = await this.provider.db
              .insert(TasskQuestion)
              .values({ taskId, type: question.type, isFirst, isLast, text: question.question })
              .returning({ id: TasskQuestion.id });

            question?.options?.split(',')?.map(async (option) => {
              await this.provider.db.insert(TasskQuestionOptions).values({ questionId: res.id, text: option });
            });
          }
        }
      }),
    );

    fs.rm(file.path, () => {});
  }

  async HttpHandleUpdateTassk(body: Dto.UpdateTasskBody) {
    await this.provider.db.transaction(async (tx) => {
      const category = await tx.query.TasskCategory.findFirst({
        where: eq(TasskCategory.id, body.categoryId),
      });

      const [task] = await tx
        .update(Tassk)
        .set({
          name: category.name,
          reward: body.reward,
          categoryId: body.categoryId,
          description: body.description,
        })
        .where(eq(Tassk.id, body.id))
        .returning({ id: Tassk.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          if (!data.id) {
            let [question] = await tx
              .insert(TasskQuestion)
              .values({
                type: data.type,
                taskId: task.id,
                text: data.question,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              })
              .returning({ id: TasskQuestion.id })
              .onConflictDoUpdate({
                target: [TasskQuestion.text, TasskQuestion.taskId],
                set: {
                  taskId: task.id,
                  type: data.type,
                  text: data.question,
                  isFirst: index === 0,
                  isLast: index === body.questions.length - 1,
                },
              });

            if (!question)
              question = await tx.query.Question.findFirst({ where: eq(TasskQuestion.text, data.question) });

            await Promise.all(
              data?.options?.map(async (option) => {
                await tx
                  .insert(TasskQuestionOptions)
                  .values({ questionId: question.id, point: option.point, text: option.value })
                  .onConflictDoNothing({ target: [TasskQuestionOptions.questionId, TasskQuestionOptions.text] });
              }),
            );
          } else {
            const [question] = await tx
              .update(TasskQuestion)
              .set({
                type: data.type,
                taskId: task.id,
                text: data.question,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              })
              .where(eq(TasskQuestion.id, data.id))
              .returning({ id: TasskQuestion.id });

            await Promise.all(
              data?.options?.map(async (option) => {
                if (!option.id) {
                  return await tx
                    .insert(TasskQuestionOptions)
                    .values({ questionId: question.id, point: option.point, text: option.value })
                    .onConflictDoNothing();
                } else {
                  return await tx
                    .update(TasskQuestionOptions)
                    .set({ questionId: question.id, point: option.point, text: option.value })
                    .where(eq(TasskQuestionOptions.id, option.id));
                }
              }),
            );
          }
        }),
      );
    });

    return {};
  }

  async HttpHandleGetUserUnCompletedTasks(user: TUser) {
    const completedTasksId = [];

    const userTaskActivity = await this.provider.db.query.TasskActivity.findMany({
      where: and(eq(TasskActivity.userId, user.id)),
    });

    userTaskActivity.forEach((task) => {
      completedTasksId.push(task.taskId);
    });

    console.log(completedTasksId);

    const completedFilter = completedTasksId?.length ? notInArray(Tassk.id, completedTasksId) : undefined;

    const data = await this.provider.db.query.Tassk.findMany({
      orderBy: desc(Tassk.updatedAt),
      with: { questions: { with: { options: true } } },
      where: and(eq(Tassk.status, 'ACTIVE'), completedFilter),
    });

    return { data };
  }

  async HttpHandleGetTasskById(id: string) {
    const taskId = parseInt(id);
    const field = isNaN(taskId) ? Tassk.slug : Tassk.id;
    const data = await this.provider.db.query.Tassk.findFirst({
      where: eq(field, id),
      with: { questions: { with: { options: true }, orderBy: asc(Tassk.id) } },
    });

    return { data };
  }

  async HttpHandleGetCompletedTasks(user: TUser, query: { completedDate: string }) {
    const { completedDate } = query;
    const completedTasksId: { taskId: number; completedDate: string }[] = [];

    const userTaskActivity = completedDate
      ? await this.provider.db.query.TasskActivity.findMany({
          where: and(
            eq(TasskActivity.userId, user.id),
            eq(TasskActivity.status, 'COMPLETED'),
            eq(TasskActivity.completedDate, completedDate),
          ),
        })
      : await this.provider.db.query.TasskActivity.findMany({
          where: and(eq(TasskActivity.userId, user.id), eq(TasskActivity.status, 'COMPLETED')),
        });

    userTaskActivity.forEach((task) => {
      completedTasksId.push({ taskId: task.taskId, completedDate: task.completedDate });
    });

    let data = [];

    console.log(completedTasksId);

    const taskActivity =
      completedTasksId.length > 0
        ? await this.provider.db.query.Tassk.findMany({
            where: inArray(
              Tassk.id,
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

    return { data };
  }

  async HttpHandleGetProcessingTasks(user: TUser) {
    const processingTasksId = [];

    const userTaskActivity = await this.provider.db.query.TasskActivity.findMany({
      where: and(eq(TasskActivity.userId, user.id), eq(TasskActivity.status, 'PROCESSING')),
    });

    userTaskActivity.forEach((task) => {
      processingTasksId.push(task.taskId);
    });

    if (!processingTasksId?.length) return { data: [] };

    const tasks = await this.provider.db.query.Tassk.findMany({
      where: inArray(Tassk.id, processingTasksId),
    });
    return { data: tasks };
  }

  async HttpHandleAnswerTask(input: Dto.AnswerTaskDto, user: TUser) {
    const { questionId, taskId, response } = input;

    const task = await this.provider.db.query.Tassk.findFirst({
      where: eq(Tassk.id, taskId),
    });

    const wallet = await this.provider.db.query.Wallet.findFirst({
      where: eq(Wallet.userId, user.id),
    });

    const userTaskActivity = await this.provider.db.query.TasskActivity.findFirst({
      where: and(eq(TasskActivity.userId, user.id), eq(TasskActivity.taskId, input.taskId)),
    });

    const question = await this.provider.db.query.TasskQuestion.findFirst({
      with: { options: true },
      where: eq(TasskQuestion.id, questionId),
    });

    if (!question) throw new BadRequestException(RESPONSE.INVALID_RESPONSE);
    // @TODO change option_id relations to comma separated strings

    if (!userTaskActivity) {
      await this.provider.db.insert(TasskActivity).values({ taskId, userId: user.id }).execute();
    }

    if (question.isLast) {
      await this.provider.db
        .update(TasskActivity)
        .set({ status: 'COMPLETED', completedDate: new Date().toISOString() })
        .where(and(eq(TasskActivity.id, userTaskActivity.id), eq(TasskActivity.userId, user.id)));

      await this.provider.db
        .update(Wallet)
        .set({ balance: wallet.balance + task.reward })
        .where(eq(Wallet.userId, user.id));
    }

    return await this.provider.db
      .insert(TasskQuestionAnswer)
      .values({ questionId, response, userId: user.id })
      .execute();
  }
}
