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
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { createSlug, getRewardValue } from '@/core/utils';
import { generatePagination, getPage } from '@/core/utils/page';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import excelToJson from 'convert-excel-to-json';
import { generateCode } from '@/core/utils/code';
import { TDbProvider } from '../drizzle/drizzle.module';
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
      const category = await tx.query.QuestionnaireCategory.findFirst({
        where: eq(QuestionnaireCategory.id, body.categoryId),
      });

      const code = generateCode();
      const slug = createSlug(category.name + code);

      const [questionnaire] = await tx
        .insert(Questionnaire)
        .values({
          slug,
          name: category.name,
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

  async HttphandleGetQuestionnaires({ q, page, pageSize }: Dto.GetAllQuestionnaireQuery) {
    const searchQuery = `%${q}%`;
    const { limit, offset } = getPage({ page, pageSize });

    const queryFilter = q
      ? or(
          ilike(Questionnaire.name, searchQuery),
          ilike(Questionnaire.slug, searchQuery),
          ilike(Questionnaire.description, searchQuery),
        )
      : undefined;

    return await this.provider.db.transaction(async (tx) => {
      const data = await this.provider.db.query.Questionnaire.findMany({
        limit,
        offset,
        where: queryFilter,
        orderBy: desc(Questionnaire.updatedAt),
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
        const code = generateCode();
        const name = `${category}-${code}`;
        const questions = sheets[category];

        for (const question of questions) {
          if (question.id === 'id') {
            const reward = getRewardValue(Object.keys(question)) || 0;

            const [res] = await this.provider.db
              .insert(Questionnaire)
              .values({ type: 'QUESTIONNAIRE', name, description: '', slug: createSlug(name), reward })
              .returning({ id: Questionnaire.id });

            questionnaireId = res?.id;
          } else {
            const isLast = false;
            const isFirst = question.id === 1;

            console.log(question);

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
