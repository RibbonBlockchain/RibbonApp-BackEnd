import {
  TUser,
  Question,
  Questionnaire,
  QuestionOptions,
  QuestionnaireRating,
  QuestionnaireActivity,
  QuestionnaireCategory,
} from '../drizzle/schema';
import fs from 'fs';
import * as Dto from './dto';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import excelToJson from 'convert-excel-to-json';
import { generateCode } from '@/core/utils/code';
import { TDbProvider } from '../drizzle/drizzle.module';
import { createSlug, getRewardValue } from '@/core/utils';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { generatePagination, getPage } from '@/core/utils/page';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class QuestionnaireService {
  constructor(@Inject(DATABASE) private readonly provider: TDbProvider) {}

  async HttpHandleCreateQuestionnaireCategory(body: Dto.CreateQuestionnaireCategoryBody) {
    await this.provider.db
      .insert(QuestionnaireCategory)
      .values({ name: body.name, slug: createSlug(body.name), description: body.description })
      .onConflictDoNothing();

    return {};
  }

  async HttpHandleAddQuestionnaire(body: Dto.AddQuestionnaireBody) {
    await this.provider.db.transaction(async (tx) => {
      let categoryName = '';

      if (body.categoryId) {
        const category = await tx.query.QuestionnaireCategory.findFirst({
          where: eq(QuestionnaireCategory.id, body.categoryId),
        });
        categoryName = category.name;
      }

      if (body.category) {
        let [category] = await tx
          .insert(QuestionnaireCategory)
          .values({ name: body.category, slug: createSlug(body.category) })
          .onConflictDoNothing()
          .returning();

        if (!category)
          category = await tx.query.QuestionnaireCategory.findFirst({
            where: eq(QuestionnaireCategory.name, body.category),
          });

        categoryName = category.name;
        body.categoryId = category.id;
      }

      if (!categoryName) throw new BadRequestException('Invalid questionnaire category');

      const code = generateCode();
      const slug = createSlug(categoryName + ' ' + code);

      const [questionnaire] = await tx
        .insert(Questionnaire)
        .values({
          slug,
          name: categoryName,
          reward: body.reward,
          type: 'QUESTIONNAIRE',
          categoryId: body.categoryId,
          description: body.description,
        })
        .returning({ id: Questionnaire.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          const [question] = await tx
            .insert(Question)
            .values({
              type: data.type,
              text: data.question,
              isFirst: index === 0,
              taskId: questionnaire.id,
              isLast: index === body.questions.length - 1,
            })
            .returning({ id: Question.id })
            .onConflictDoUpdate({
              target: [Question.text, Question.taskId],
              set: {
                type: data.type,
                text: data.question,
                isFirst: index === 0,
                taskId: questionnaire.id,
                isLast: index === body.questions.length - 1,
              },
            });

          await Promise.all(
            data?.options?.map(async (option) => {
              await tx
                .insert(QuestionOptions)
                .values({ questionId: question.id, point: option.point, text: option.value });
            }),
          );
        }),
      );
    });

    return {};
  }

  async HttpHandleUpdateQuestionnaire(body: Dto.UpdateQuestionnaireBody) {
    await this.provider.db.transaction(async (tx) => {
      const category = await tx.query.QuestionnaireCategory.findFirst({
        where: eq(QuestionnaireCategory.id, body.categoryId),
      });

      const [questionnaire] = await tx
        .update(Questionnaire)
        .set({
          name: category.name,
          reward: body.reward,
          type: 'QUESTIONNAIRE',
          categoryId: body.categoryId,
          description: body.description,
        })
        .where(eq(Questionnaire.id, body.id))
        .returning({ id: Questionnaire.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          if (!data.id) {
            let [question] = await tx
              .insert(Question)
              .values({
                type: data.type,
                text: data.question,
                isFirst: index === 0,
                taskId: questionnaire.id,
                isLast: index === body.questions.length - 1,
              })
              .returning({ id: Question.id })
              .onConflictDoUpdate({
                target: [Question.text, Question.taskId],
                set: {
                  type: data.type,
                  text: data.question,
                  isFirst: index === 0,
                  taskId: questionnaire.id,
                  isLast: index === body.questions.length - 1,
                },
              });

            if (!question) question = await tx.query.Question.findFirst({ where: eq(Question.text, data.question) });

            await Promise.all(
              data?.options?.map(async (option) => {
                await tx
                  .insert(QuestionOptions)
                  .values({ questionId: question.id, point: option.point, text: option.value })
                  .onConflictDoNothing({ target: [QuestionOptions.questionId, QuestionOptions.text] });
              }),
            );
          } else {
            const [question] = await tx
              .update(Question)
              .set({
                type: data.type,
                text: data.question,
                isFirst: index === 0,
                taskId: questionnaire.id,
                isLast: index === body.questions.length - 1,
              })
              .where(eq(Question.id, data.id))
              .returning({ id: Question.id });

            await Promise.all(
              data?.options?.map(async (option) => {
                if (!option.id) {
                  return await tx
                    .insert(QuestionOptions)
                    .values({ questionId: question.id, point: option.point, text: option.value })
                    .onConflictDoNothing();
                } else {
                  return await tx
                    .update(QuestionOptions)
                    .set({ questionId: question.id, point: option.point, text: option.value })
                    .where(eq(QuestionOptions.id, option.id));
                }
              }),
            );
          }
        }),
      );
    });

    return {};
  }

  async HttpHandleGetTaskCategories({ q, page, pageSize }: Dto.GetAllQuestionnaireCategoryQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const queryFilter = q
      ? or(
          ilike(QuestionnaireCategory.name, searchQuery),
          ilike(QuestionnaireCategory.slug, searchQuery),
          ilike(QuestionnaireCategory.description, searchQuery),
        )
      : undefined;

    return await this.provider.db.transaction(async (tx) => {
      const data = await tx.query.QuestionnaireCategory.findMany({
        limit,
        offset,
        where: queryFilter,
        orderBy: desc(QuestionnaireCategory.updatedAt),
      });

      const [{ total }] = await tx
        .select({ total: sql<number>`cast(count(${QuestionnaireCategory.id}) as int)` })
        .from(QuestionnaireCategory)
        .where(queryFilter);

      return { data, pagination: generatePagination(page, pageSize, total) };
    });
  }

  async HttpHandleUpdateQuestionnaireStatus(body: Dto.UpdateQuestionnaireStatusBody) {
    await this.provider.db.update(Questionnaire).set({ status: body.status }).where(eq(Questionnaire.id, body.id));
    return {};
  }

  async HttpHandleGetQuestionnaireSummary() {
    return await this.provider.db.transaction(async (tx) => {
      const [{ active }] = await tx
        .select({ active: sql<number>`cast(count(${Questionnaire.id}) as int)` })
        .from(Questionnaire)
        .where(eq(Questionnaire.status, 'ACTIVE'));

      const [{ closed }] = await tx
        .select({ closed: sql<number>`cast(count(${Questionnaire.id}) as int)` })
        .from(Questionnaire)
        .where(eq(Questionnaire.status, 'CLOSED'));

      return { count: { active, closed } };
    });
  }

  async HttphandleGetQuestionnaires({ q, page, status, pageSize }: Dto.GetAllQuestionnaireQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const statusFilter = status ? eq(Questionnaire.status, status) : undefined;

    const queryFilter = q
      ? or(
          ilike(Questionnaire.name, searchQuery),
          ilike(Questionnaire.slug, searchQuery),
          ilike(Questionnaire.description, searchQuery),
        )
      : undefined;

    return await this.provider.db.transaction(async (tx) => {
      const data = await tx.query.Questionnaire.findMany({
        limit,
        offset,
        where: and(queryFilter, statusFilter),
        orderBy: desc(Questionnaire.updatedAt),
        with: { questions: { limit: 1 }, activities: { limit: 1 }, category: true },
        extras: {
          totalResponses:
            sql<number>`(SELECT CAST(COUNT(*) as int) FROM ${QuestionnaireActivity} WHERE ${Questionnaire.id} = questionnaire_activity.task_id)`.as(
              'responses',
            ),
          totalQuestions:
            sql<number>`(SELECT CAST(COUNT(*) as int) FROM ${Question} WHERE ${Questionnaire.id} = question.task_id)`.as(
              'totalQuestions',
            ),
        },
      });

      const [{ total }] = await tx
        .select({ total: sql<number>`cast(count(${Questionnaire.id}) as int)` })
        .from(Questionnaire)
        .where(and(statusFilter, queryFilter));

      return { data, pagination: generatePagination(page, pageSize, total) };
    });
  }

  async HttphandleGetQuestionnaireById(id: number) {
    return await this.provider.db.query.Questionnaire.findFirst({
      where: eq(Questionnaire.id, id),
      with: { category: true, questions: { with: { options: true } } },
    });
  }

  async HttpHandleRateQuestionnaire(body: Dto.RateQuestionnaireBody, user: TUser) {
    const activity = await this.provider.db.query.QuestionnaireActivity.findFirst({
      with: { task: { columns: { id: true } } },
      where: and(
        eq(QuestionnaireActivity.userId, user.id),
        eq(QuestionnaireActivity.status, 'COMPLETED'),
        eq(QuestionnaireActivity.taskId, body.questionnaireId),
      ),
    });

    if (!activity?.id) throw new BadRequestException(RESPONSE.COMPLETE_QUESTIONNAIRE_TO_CONTINUE);

    const questionnaire = await this.provider.db.query.Questionnaire.findFirst({
      where: eq(Questionnaire.id, activity.taskId),
    });

    if (!questionnaire) throw new BadRequestException(RESPONSE.INVALID_TASK);

    const rating = Math.max(0, Math.min(body.rating, 5));

    await this.provider.db
      .insert(QuestionnaireRating)
      .values({ questionId: activity.taskId, userId: user.id, rating })
      .onConflictDoNothing();

    const ratings = (questionnaire.ratings || 0) + 1;
    const totalRatings = (questionnaire.totalRatings + body.rating) / ratings;
    await this.provider.db.update(Questionnaire).set({ ratings, totalRatings });

    return {};
  }

  async HttpHandleUploadQuestionnaires(file: Express.Multer.File) {
    const sheets = excelToJson({
      sourceFile: file.path,
      columnToKey: { '*': '{{columnHeader}}' },
    });

    await Promise.all(
      Object.keys(sheets).map(async (category) => {
        let questionnaireId = 0;
        const questions = sheets[category];

        let [cat] = await this.provider.db
          .insert(QuestionnaireCategory)
          .values({ name: category, slug: createSlug(category), description: '' })
          .onConflictDoNothing()
          .returning();

        if (!cat) {
          cat = await this.provider.db.query.QuestionnaireCategory.findFirst({
            where: eq(QuestionnaireCategory.slug, createSlug(category)),
          });
        }

        for (const question of questions) {
          if (question?.id === 'id') {
            const name = `${category} ${generateCode()}`.trim();
            const reward = getRewardValue(Object.keys(question)) || 0;

            const [res] = await this.provider.db
              .insert(Questionnaire)
              .values({
                reward,
                name: category,
                description: '',
                categoryId: cat?.id,
                type: 'QUESTIONNAIRE',
                slug: createSlug(name),
              })
              .returning({ id: Questionnaire.id });

            questionnaireId = res?.id;
          } else {
            const isFirst = question.id === 1;
            const isLast = question.id === questions?.length - 1;

            const [res] = await this.provider.db
              .insert(Question)
              .values({ taskId: questionnaireId, type: question.type, isFirst, isLast, text: question.question })
              .returning({ id: Question.id });

            question?.options?.split(',')?.map(async (option) => {
              await this.provider.db.insert(QuestionOptions).values({ questionId: res.id, text: option });
            });
          }
        }
      }),
    );

    fs.rm(file.path, () => {});
  }

  async HttpHandleUpdateSes(input: Dto.UpdateSesData[]) {
    input.map(async ({ optionId, point }) => {
      await this.provider.db.update(QuestionOptions).set({ point }).where(eq(QuestionOptions.id, optionId));
    });
    return {};
  }
}
