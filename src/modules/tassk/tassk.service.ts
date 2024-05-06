import {
  Tassk,
  TUser,
  TasskRating,
  TasskActivity,
  TasskCategory,
  TasskQuestion,
  TasskQuestionOptions,
} from '../drizzle/schema';
import fs from 'fs';
import * as Dto from './dto';
import { and, eq } from 'drizzle-orm';
import { RESPONSE } from '@/core/responses';
import { DATABASE } from '@/core/constants';
import { getPage } from '@/core/utils/page';
import excelToJson from 'convert-excel-to-json';
import { generateCode } from '@/core/utils/code';
import { TDbProvider } from '../drizzle/drizzle.module';
import { createSlug, getRewardValue } from '@/core/utils';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class TasskService {
  constructor(@Inject(DATABASE) private readonly provider: TDbProvider) {}

  async HttpHandleGetTasskCategories() {
    return await this.provider.db.query.TasskCategory.findMany({});
  }

  async HttpHandleCreateTasskCategory(body: Dto.CreateTasskCategoryBody) {
    await this.provider.db
      .insert(TasskCategory)
      .values({ name: body.name, slug: createSlug(body.name), description: body.description })
      .onConflictDoNothing();

    return {};
  }

  async HttphandleGetTassks(query: Dto.GetAllTasskQuery) {
    const { limit, offset } = getPage({ page: query.page, pageSize: query.pageSize });
    const data = await this.provider.db.query.Tassk.findMany({ limit, offset });
    return { data };
  }

  async HttphandleGetTasskById(id: number) {
    return await this.provider.db.query.Tassk.findFirst({ where: eq(Tassk.id, id), with: { questions: true } });
  }

  async HttpHandleRateTassk(body: Dto.RateTasskBody, user: TUser) {
    const activity = await this.provider.db.query.TasskActivity.findFirst({
      with: { survey: { columns: { id: true } } },
      where: and(
        eq(TasskActivity.userId, user.id),
        eq(TasskActivity.status, 'COMPLETED'),
        eq(TasskActivity.taskId, body.surveyId),
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
      const category = await tx.query.TasskCategory.findFirst({
        where: eq(TasskCategory.id, body.categoryId),
      });

      if (!category) throw new BadRequestException('Category not found');

      const [survey] = await tx
        .insert(Tassk)
        .values({
          description: '',
          name: category.name,
          reward: body.reward,
          categoryId: category.id,
        })
        .returning({ id: Tassk.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          await tx
            .insert(TasskQuestion)
            .values({
              type: data.type,
              taskId: survey.id,
              text: data.question,
              isFirst: index === 0,
              isLast: index === body.questions.length - 1,
            })
            .onConflictDoUpdate({
              target: [TasskQuestion.text, TasskQuestion.taskId],
              set: {
                taskId: survey.id,
                text: data.question,
                isFirst: index === 0,
                isLast: index === body.questions.length - 1,
              },
            });
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
        const code = generateCode();
        const name = `${category}-${code}`;
        const questions = sheets[category];

        const [{ id: categoryId }] = await this.provider.db
          .insert(TasskCategory)
          .values({ name: category, slug: createSlug(category), description: '' })
          .onConflictDoNothing()
          .returning({ id: TasskCategory.id });

        for (const question of questions) {
          if (question.id === 'id') {
            const reward = getRewardValue(Object.keys(question)) || 0;

            const [res] = await this.provider.db
              .insert(Tassk)
              .values({ categoryId, name, description: '', slug: createSlug(name), reward })
              .returning({ id: Tassk.id });

            taskId = res?.id;
          } else {
            const isLast = false;
            const isFirst = question.id === 1;

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
}
