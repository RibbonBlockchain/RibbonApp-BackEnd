import {
  Survey,
  TUser,
  SurveyRating,
  SurveyActivity,
  SurveyCategory,
  SurveyQuestion,
  SurveyQuestionOptions,
  Wallet,
  SurveyQuestionAnswer,
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
export class SurveyService {
  constructor(@Inject(DATABASE) private readonly provider: TDbProvider) {}

  async HttpHandleGetSurveyCategories({ q, page, pageSize }: Dto.GetSurveyCategoriesQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const queryFilter = q
      ? or(
          ilike(SurveyCategory.name, searchQuery),
          ilike(SurveyCategory.slug, searchQuery),
          ilike(SurveyCategory.description, searchQuery),
        )
      : undefined;

    return await this.provider.db.transaction(async (tx) => {
      const data = await tx.query.SurveyCategory.findMany({
        limit,
        offset,
        where: queryFilter,
        orderBy: desc(SurveyCategory.updatedAt),
      });

      const [{ total }] = await tx
        .select({ total: sql<number>`cast(count(${SurveyCategory.id}) as int)` })
        .from(SurveyCategory)
        .where(queryFilter);

      return { data, pagination: generatePagination(page, pageSize, total) };
    });
  }

  async HttpHandleCreateSurveyCategory(body: Dto.CreateSurveyCategoryBody) {
    await this.provider.db
      .insert(SurveyCategory)
      .values({ name: body.name, slug: createSlug(body.name), description: body.description })
      .onConflictDoNothing();

    return {};
  }

  async HttphandleGetSurveys({ q, page, status, pageSize }: Dto.GetAllSurveyQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const statusFilter = status ? eq(Survey.status, status) : undefined;

    const queryFilter = q
      ? or(ilike(Survey.name, searchQuery), ilike(Survey.slug, searchQuery), ilike(Survey.description, searchQuery))
      : undefined;

    return await this.provider.db.transaction(async (tx) => {
      const data = await tx.query.Survey.findMany({
        limit,
        offset,
        orderBy: desc(Survey.updatedAt),
        where: and(queryFilter, statusFilter),
        with: { questions: { limit: 1 }, activities: { limit: 1 }, category: true },
        extras: {
          totalResponses:
            sql<number>`(SELECT CAST(COUNT(*) as int) FROM ${SurveyActivity} WHERE ${Survey.id} = survey_activity.survey_id)`.as(
              'responses',
            ),
          totalQuestions:
            sql<number>`(SELECT CAST(COUNT(*) as int) FROM ${SurveyQuestion} WHERE ${Survey.id} = survey_question.survey_id)`.as(
              'totalQuestions',
            ),
        },
      });

      const [{ total }] = await tx
        .select({ total: sql<number>`cast(count(${Survey.id}) as int)` })
        .from(Survey)
        .where(and(statusFilter, queryFilter));

      return { data, pagination: generatePagination(page, pageSize, total) };
    });
  }

  async HttpHandleGetSurveySummary() {
    return await this.provider.db.transaction(async (tx) => {
      const [{ active }] = await tx
        .select({ active: sql<number>`cast(count(${Survey.id}) as int)` })
        .from(Survey)
        .where(eq(Survey.status, 'ACTIVE'));

      const [{ closed }] = await tx
        .select({ closed: sql<number>`cast(count(${Survey.id}) as int)` })
        .from(Survey)
        .where(eq(Survey.status, 'CLOSED'));

      return { count: { active, closed } };
    });
  }

  async HttphandleAdminGetSurveyById(id: number) {
    return await this.provider.db.query.Survey.findFirst({
      where: eq(Survey.id, id),
      with: { questions: { with: { options: true } }, category: true },
    });
  }

  async HttpHandleUpdateSurveyStatus(body: Dto.UpdateSurveyStatusBody) {
    await this.provider.db.update(Survey).set({ status: body.status }).where(eq(Survey.id, body.id));
    return {};
  }

  async HttpHandleRateSurvey(body: Dto.RateSurveyBody, user: TUser) {
    const activity = await this.provider.db.query.SurveyActivity.findFirst({
      with: { survey: { columns: { id: true } } },
      where: and(
        eq(SurveyActivity.userId, user.id),
        eq(SurveyActivity.status, 'COMPLETED'),
        eq(SurveyActivity.surveyId, body.surveyId),
      ),
    });

    if (!activity?.id) throw new BadRequestException(RESPONSE.COMPLETE_SURVEY_TO_CONTINUE);

    const survey = await this.provider.db.query.Survey.findFirst({
      where: eq(Survey.id, activity.surveyId),
    });

    if (!survey) throw new BadRequestException(RESPONSE.INVALID_SURVEY);

    const rating = Math.max(0, Math.min(body.rating, 5));

    await this.provider.db
      .insert(SurveyRating)
      .values({ surveyId: activity.surveyId, userId: user.id, rating })
      .onConflictDoNothing();

    const totalRatings = (survey.totalRatings || 0) + 1;
    const ratings = ((survey.ratings || 0) + body.rating) / totalRatings;
    console.log(body.rating, totalRatings, ratings);
    await this.provider.db.update(Survey).set({ ratings, totalRatings }).where(eq(Survey.id, survey.id));

    return {};
  }

  async HttpHandleAddSurvey(body: Dto.AddSurveyBody) {
    await this.provider.db.transaction(async (tx) => {
      let categoryName = '';

      if (body.categoryId) {
        const category = await tx.query.SurveyCategory.findFirst({
          where: eq(SurveyCategory.id, body.categoryId),
        });
        categoryName = category.name;
      }

      if (body.category) {
        let [category] = await tx
          .insert(SurveyCategory)
          .values({ name: body.category, slug: createSlug(body.category) })
          .onConflictDoNothing()
          .returning();

        if (!category)
          category = await tx.query.QuestionnaireCategory.findFirst({
            where: eq(SurveyCategory.name, body.category),
          });

        categoryName = category.name;
        body.categoryId = category.id;
      }

      if (!categoryName) throw new BadRequestException('Invalid survey category');

      const code = generateCode();
      const slug = createSlug(categoryName + ' ' + code);

      const [survey] = await tx
        .insert(Survey)
        .values({
          slug,
          name: categoryName,
          reward: body.reward,
          categoryId: body.categoryId,
          description: body.description,
        })
        .returning({ id: Survey.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          const [question] = await tx
            .insert(SurveyQuestion)
            .values({
              type: data.type,
              text: data.question,
              surveyId: survey.id,
              isFirst: index === 0,
              isLast: index === body.questions.length - 1,
            })
            .returning({ id: SurveyQuestion.id })
            .onConflictDoUpdate({
              target: [SurveyQuestion.text, SurveyQuestion.surveyId],
              set: {
                type: data.type,
                text: data.question,
                surveyId: survey.id,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              },
            });

          await Promise.all(
            data?.options?.map(async (option) => {
              await tx
                .insert(SurveyQuestionOptions)
                .values({ questionId: question.id, point: option.point, text: option.value });
            }),
          );
        }),
      );
    });

    return {};
  }

  async HttpHandleUploadSurveys(file: Express.Multer.File) {
    const sheets = excelToJson({
      sourceFile: file.path,
      columnToKey: { '*': '{{columnHeader}}' },
    });

    await Promise.all(
      Object.keys(sheets).map(async (category) => {
        let surveyId = 0;
        const questions = sheets[category];

        let [cat] = await this.provider.db
          .insert(SurveyCategory)
          .values({ name: category, slug: createSlug(category), description: '' })
          .onConflictDoNothing()
          .returning();

        if (!cat) {
          cat = await this.provider.db.query.SurveyCategory.findFirst({
            where: eq(SurveyCategory.slug, createSlug(category)),
          });
        }

        for (const question of questions) {
          if (question.id === 'id') {
            const name = `${category} ${generateCode()}`.trim();
            const reward = getRewardValue(Object.keys(question)) || 0;

            const [res] = await this.provider.db
              .insert(Survey)
              .values({ categoryId: cat.id, name, description: '', slug: createSlug(name), reward })
              .returning({ id: Survey.id });

            surveyId = res?.id;
          } else {
            const isFirst = question.id === 1;
            const isLast = question.id === questions?.length - 1;

            const [res] = await this.provider.db
              .insert(SurveyQuestion)
              .values({ surveyId, type: question.type, isFirst, isLast, text: question.question })
              .returning({ id: SurveyQuestion.id });

            question?.options?.split(',')?.map(async (option) => {
              await this.provider.db.insert(SurveyQuestionOptions).values({ questionId: res.id, text: option });
            });
          }
        }
      }),
    );

    fs.rm(file.path, () => {});
  }

  async HttpHandleUpdateSes(input: Dto.UpdateSesBody[]) {
    input.map(async ({ optionId, point }) => {
      await this.provider.db.update(SurveyQuestionOptions).set({ point }).where(eq(SurveyQuestionOptions.id, optionId));
    });
  }

  async HttpHandleUpdateQuestionnaire(body: Dto.UpdateSurveyBody) {
    await this.provider.db.transaction(async (tx) => {
      const category = await tx.query.QuestionnaireCategory.findFirst({
        where: eq(SurveyCategory.id, body.categoryId),
      });

      const [survey] = await tx
        .update(Survey)
        .set({
          name: category.name,
          reward: body.reward,
          categoryId: body.categoryId,
          description: body.description,
        })
        .where(eq(Survey.id, body.id))
        .returning({ id: Survey.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          if (!data.id) {
            let [question] = await tx
              .insert(SurveyQuestion)
              .values({
                type: data.type,
                text: data.question,
                surveyId: survey.id,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              })
              .returning({ id: SurveyQuestion.id })
              .onConflictDoUpdate({
                target: [SurveyQuestion.text, SurveyQuestion.surveyId],
                set: {
                  type: data.type,
                  text: data.question,
                  surveyId: survey.id,
                  isFirst: index === 0,
                  isLast: index === body.questions.length - 1,
                },
              });

            if (!question)
              question = await tx.query.Question.findFirst({ where: eq(SurveyQuestion.text, data.question) });

            await Promise.all(
              data?.options?.map(async (option) => {
                await tx
                  .insert(SurveyQuestionOptions)
                  .values({ questionId: question.id, point: option.point, text: option.value })
                  .onConflictDoNothing({ target: [SurveyQuestionOptions.questionId, SurveyQuestionOptions.text] });
              }),
            );
          } else {
            const [question] = await tx
              .update(SurveyQuestion)
              .set({
                type: data.type,
                text: data.question,
                surveyId: survey.id,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              })
              .where(eq(SurveyQuestion.id, data.id))
              .returning({ id: SurveyQuestion.id });

            await Promise.all(
              data?.options?.map(async (option) => {
                if (!option.id) {
                  return await tx
                    .insert(SurveyQuestionOptions)
                    .values({ questionId: question.id, point: option.point, text: option.value })
                    .onConflictDoNothing();
                } else {
                  return await tx
                    .update(SurveyQuestionOptions)
                    .set({ questionId: question.id, point: option.point, text: option.value })
                    .where(eq(SurveyQuestionOptions.id, option.id));
                }
              }),
            );
          }
        }),
      );
    });

    return {};
  }
  async HttpHandleUpdateSurvey(body: Dto.UpdateSurveyBody) {
    await this.provider.db.transaction(async (tx) => {
      const category = await tx.query.SurveyCategory.findFirst({
        where: eq(SurveyCategory.id, body.categoryId),
      });

      const [survey] = await tx
        .update(Survey)
        .set({
          name: category.name,
          reward: body.reward,
          categoryId: body.categoryId,
          description: body.description,
        })
        .where(eq(Survey.id, body.id))
        .returning({ id: Survey.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          if (!data.id) {
            let [question] = await tx
              .insert(SurveyQuestion)
              .values({
                type: data.type,
                surveyId: survey.id,
                text: data.question,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              })
              .returning({ id: SurveyQuestion.id })
              .onConflictDoUpdate({
                target: [SurveyQuestion.text, SurveyQuestion.surveyId],
                set: {
                  type: data.type,
                  text: data.question,
                  surveyId: survey.id,
                  isFirst: index === 0,
                  isLast: index === body.questions.length - 1,
                },
              });

            if (!question)
              question = await tx.query.Question.findFirst({ where: eq(SurveyQuestion.text, data.question) });

            await Promise.all(
              data?.options?.map(async (option) => {
                await tx
                  .insert(SurveyQuestionOptions)
                  .values({ questionId: question.id, point: option.point, text: option.value })
                  .onConflictDoNothing({ target: [SurveyQuestionOptions.questionId, SurveyQuestionOptions.text] });
              }),
            );
          } else {
            const [question] = await tx
              .update(SurveyQuestion)
              .set({
                type: data.type,
                text: data.question,
                surveyId: survey.id,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              })
              .where(eq(SurveyQuestion.id, data.id))
              .returning({ id: SurveyQuestion.id });

            await Promise.all(
              data?.options?.map(async (option) => {
                if (!option.id) {
                  return await tx
                    .insert(SurveyQuestionOptions)
                    .values({ questionId: question.id, point: option.point, text: option.value })
                    .onConflictDoNothing();
                } else {
                  return await tx
                    .update(SurveyQuestionOptions)
                    .set({ questionId: question.id, point: option.point, text: option.value })
                    .where(eq(SurveyQuestionOptions.id, option.id));
                }
              }),
            );
          }
        }),
      );
    });

    return {};
  }

  async HttpHandleGetUserUnCompletedSurveys(user: TUser) {
    const completedSurveysId = [];

    const userSurveyActivity = await this.provider.db.query.SurveyActivity.findMany({
      where: and(eq(SurveyActivity.userId, user.id)),
    });

    userSurveyActivity.forEach((survey) => {
      completedSurveysId.push(survey.surveyId);
    });

    const completedFilter = completedSurveysId?.length ? notInArray(Survey.id, completedSurveysId) : undefined;

    const data = await this.provider.db.query.Survey.findMany({
      orderBy: desc(Survey.updatedAt),
      with: { questions: { with: { options: true } } },
      where: and(eq(Survey.status, 'ACTIVE'), completedFilter),
    });

    return { data };
  }

  async HttpHandleGetSurveyById(id: string) {
    const surveyId = parseInt(id);
    const field = isNaN(surveyId) ? Survey.slug : Survey.id;
    const data = await this.provider.db.query.Survey.findFirst({
      where: eq(field, id),
      with: { questions: { with: { options: true }, orderBy: asc(Survey.id) } },
    });

    return { data };
  }

  async HttpHandleAnswerSurvey(input: Dto.AnswerSurveyDto, user: TUser) {
    const { optionId, questionId, surveyId } = input;

    const task = await this.provider.db.query.Survey.findFirst({
      where: eq(Survey.id, surveyId),
    });

    const wallet = await this.provider.db.query.Wallet.findFirst({
      where: eq(Wallet.userId, user.id),
    });

    const userSurveyActivity = await this.provider.db.query.SurveyActivity.findFirst({
      where: and(eq(SurveyActivity.userId, user.id), eq(SurveyActivity.surveyId, input.surveyId)),
    });

    const question = await this.provider.db.query.SurveyQuestion.findFirst({
      with: { options: true },
      where: eq(SurveyQuestion.id, questionId),
    });

    if (!question) throw new BadRequestException(RESPONSE.INVALID_RESPONSE);

    const isTextAnswer =
      (!question?.options?.length && question.type !== 'BOOLEAN') ||
      question.type === 'LONG_ANSWER' ||
      question.type === 'SHORT_ANSWER';
    if (isTextAnswer && typeof optionId !== 'string') throw new BadRequestException(RESPONSE.INVALID_RESPONSE);

    let answer = '';
    let singleOption: any = 0;

    // @TODO change option_id relations to comma separated strings

    if (typeof optionId === 'string') answer = optionId;
    if (typeof optionId === 'number') singleOption = optionId;
    if (Array.isArray(optionId)) singleOption = optionId?.[0];

    const option = await this.provider.db.query.SurveyQuestionOptions.findFirst({
      where: eq(SurveyQuestionOptions.id, singleOption),
    });

    if (!userSurveyActivity) {
      await this.provider.db.insert(SurveyActivity).values({ surveyId, userId: user.id }).execute();
    }

    if (question.isLast) {
      await this.provider.db
        .update(SurveyActivity)
        .set({ status: 'COMPLETED', completedDate: new Date().toISOString() })
        .where(and(eq(SurveyActivity.id, userSurveyActivity.id), eq(SurveyActivity.userId, user.id)));

      await this.provider.db
        .update(Wallet)
        .set({ balance: wallet.balance + task.reward, point: option.point + wallet.point })
        .where(eq(Wallet.userId, user.id));
    }

    return await this.provider.db
      .insert(SurveyQuestionAnswer)
      .values({ questionId, optionId: singleOption || undefined, text: answer || undefined, userId: user.id })
      .execute();
  }

  async HttpHandleGetProcessingSurveys(user: TUser) {
    const processingSurveysId = [];

    const userSurveyActivity = await this.provider.db.query.SurveyActivity.findMany({
      where: and(eq(SurveyActivity.userId, user.id), eq(SurveyActivity.status, 'PROCESSING')),
    });

    userSurveyActivity.forEach((survey) => {
      processingSurveysId.push(survey.surveyId);
    });

    if (!processingSurveysId?.length) return { data: [] };

    const tasks = await this.provider.db.query.Survey.findMany({
      where: inArray(Survey.id, processingSurveysId),
    });
    return { data: tasks };
  }

  async HttpHandleGetCompletedSurveys(user: TUser, query: { completedDate: string }) {
    const { completedDate } = query;
    const completedSurveysId: { surveyId: number; completedDate: string }[] = [];

    const userSurveyActivity = completedDate
      ? await this.provider.db.query.SurveyActivity.findMany({
          where: and(
            eq(SurveyActivity.userId, user.id),
            eq(SurveyActivity.status, 'COMPLETED'),
            eq(SurveyActivity.completedDate, completedDate),
          ),
        })
      : await this.provider.db.query.SurveyActivity.findMany({
          where: and(eq(SurveyActivity.userId, user.id), eq(SurveyActivity.status, 'COMPLETED')),
        });

    userSurveyActivity.forEach((survey) => {
      completedSurveysId.push({ surveyId: survey.surveyId, completedDate: survey.completedDate });
    });

    let data = [];

    console.log(completedSurveysId);

    const surveyActivity =
      completedSurveysId.length > 0
        ? await this.provider.db.query.Survey.findMany({
            where: inArray(
              Survey.id,
              completedSurveysId.map(({ surveyId }) => surveyId),
            ),
            // with: { ratings: true },
          }).then((surveys) =>
            surveys.map((survey) => ({
              ...survey,
              completedDate: completedSurveysId.find(({ surveyId }) => surveyId === survey.id)?.completedDate,
            })),
          )
        : [];

    data = [...surveyActivity];

    return { data };
  }
}
