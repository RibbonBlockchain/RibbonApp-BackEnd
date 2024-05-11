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
import { generateCode, getNumberAtEnd } from '@/core/utils/code';
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
        const [category] = await tx
          .insert(QuestionnaireCategory)
          .values({ name: body.category, slug: createSlug(body.category) })
          .returning();
        categoryName = category.name;
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
        with: { questions: { limit: 1 }, activities: { limit: 1 } },
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
        .where(queryFilter);

      return { data, pagination: generatePagination(page, pageSize, total) };
    });
  }

  async HttphandleGetQuestionnaireById(id: number) {
    return await this.provider.db.query.Questionnaire.findFirst({
      where: eq(Questionnaire.id, id),
      with: { questions: true },
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

    const rating = Math.max(0, Math.min(body.rating, 5));

    await this.provider.db
      .insert(QuestionnaireRating)
      .values({ questionId: activity.taskId, userId: user.id, rating })
      .onConflictDoNothing();

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

        const cat = await this.provider.db.query.QuestionnaireCategory.findFirst({
          orderBy: desc(QuestionnaireCategory.createdAt),
        });

        for (const question of questions) {
          const code = !cat ? '' : getNumberAtEnd(category) || '';
          const name = `${category} ${code}`.trim();

          console.log(code, name);

          if (question.id === 'id') {
            const reward = getRewardValue(Object.keys(question)) || 0;

            const [res] = await this.provider.db
              .insert(Questionnaire)
              .values({ type: 'QUESTIONNAIRE', name, description: '', slug: createSlug(name), reward })
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
}
