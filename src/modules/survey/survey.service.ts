import {
  Survey,
  TUser,
  SurveyRating,
  SurveyActivity,
  SurveyCategory,
  SurveyQuestion,
  SurveyQuestionOptions,
  QuestionOptions,
} from '../drizzle/schema';
import fs from 'fs';
import * as Dto from './dto';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
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
      const data = await tx.query.SurveyCategory.findMany({ where: queryFilter, limit, offset });

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

  async HttphandleGetSurveys({ q, page, pageSize }: Dto.GetAllSurveyQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const queryFilter = q
      ? or(ilike(Survey.name, searchQuery), ilike(Survey.slug, searchQuery), ilike(Survey.description, searchQuery))
      : undefined;

    return await this.provider.db.transaction(async (tx) => {
      const data = await tx.query.Survey.findMany({ where: queryFilter, limit, offset });

      const [{ total }] = await tx
        .select({ total: sql<number>`cast(count(${Survey.id}) as int)` })
        .from(Survey)
        .where(queryFilter);

      return { data, pagination: generatePagination(page, pageSize, total) };
    });
  }

  async HttphandleGetSurveyById(id: number) {
    return await this.provider.db.query.Survey.findFirst({ where: eq(Survey.id, id), with: { questions: true } });
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

    if (!activity?.id) throw new BadRequestException(RESPONSE.COMPLETE_QUESTIONNAIRE_TO_CONTINUE);

    const rating = Math.max(0, Math.min(body.rating, 5));

    await this.provider.db
      .insert(SurveyRating)
      .values({ surveyId: activity.surveyId, userId: user.id, rating })
      .onConflictDoNothing();

    return {};
  }

  async HttpHandleAddSurvey(body: Dto.AddSurveyBody) {
    await this.provider.db.transaction(async (tx) => {
      const category = await tx.query.SurveyCategory.findFirst({
        where: eq(SurveyCategory.id, body.categoryId),
      });

      if (!category) throw new BadRequestException('Category not found');

      const [survey] = await tx
        .insert(Survey)
        .values({
          description: '',
          name: category.name,
          reward: body.reward,
          categoryId: category.id,
        })
        .returning({ id: Survey.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          await tx
            .insert(SurveyQuestion)
            .values({
              type: data.type,
              text: data.question,
              surveyId: survey.id,
              isFirst: index === 0,
              isLast: index === body.questions.length - 1,
            })
            .onConflictDoUpdate({
              target: [SurveyQuestion.text, SurveyQuestion.surveyId],
              set: {
                text: data.question,
                surveyId: survey.id,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              },
            });
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
        const code = generateCode();
        const name = `${category}-${code}`;
        const questions = sheets[category];

        const [{ id: categoryId }] = await this.provider.db
          .insert(SurveyCategory)
          .values({ name: category, slug: createSlug(category), description: '' })
          .onConflictDoNothing()
          .returning({ id: SurveyCategory.id });

        for (const question of questions) {
          if (question.id === 'id') {
            const reward = getRewardValue(Object.keys(question)) || 0;

            const [res] = await this.provider.db
              .insert(Survey)
              .values({ categoryId, name, description: '', slug: createSlug(name), reward })
              .returning({ id: Survey.id });

            surveyId = res?.id;
          } else {
            const isLast = false;
            const isFirst = question.id === 1;

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

  async HttpHandleUpdateSes({ data }: Dto.UpdateSes) {
    data.map(async ({ optionId, point }) => {
      await this.provider.db.update(SurveyQuestionOptions).set({ point }).where(eq(SurveyQuestionOptions.id, optionId));
    });
    return {};
  }
}
