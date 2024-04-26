import {
  TUser,
  Task,
  Options,
  Question,
  TaskActivity,
  QuestionnaireRating,
  QuestionnaireCategory,
} from '../drizzle/schema';
import fs from 'fs';
import * as Dto from './dto';
import { and, eq } from 'drizzle-orm';
import { createSlug } from '@/core/utils';
import { getPage } from '@/core/utils/page';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import excelToJson from 'convert-excel-to-json';
import { generateCode } from '@/core/utils/code';
import { TDbProvider } from '../drizzle/drizzle.module';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class QuestionnaireService {
  constructor(@Inject(DATABASE) private readonly provider: TDbProvider) {}

  async HttpHandleAddQuestionnaire(body: Dto.AddQuestionnaireBody) {
    await this.provider.db.transaction(async (tx) => {
      const category = await tx.query.QuestionnaireCategory.findFirst({
        where: eq(QuestionnaireCategory.id, body.categoryId),
      });

      const [questionnaire] = await tx
        .insert(Task)
        .values({ type: 'QUESTIONNAIRE', description: '', name: category.name, reward: body.reward })
        .returning({ id: Task.id });

      await Promise.all(
        body.questions.map(async (data, index) => {
          await tx
            .insert(Question)
            .values({
              type: data.type,
              text: data.question,
              isFirst: index === 0,
              taskId: questionnaire.id,
              isLast: index === body.questions.length - 1,
            })
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
        }),
      );
    });

    return {};
  }

  async HttpHandleGetTaskCategories() {
    return await this.provider.db.query.QuestionnaireCategory.findMany({});
  }

  async HttphandleGetQuestionnaires(query: Dto.GetAllQuestionnaireQuery) {
    const { limit, offset } = getPage({ page: query.page, pageSize: query.pageSize });
    const data = await this.provider.db.query.Task.findMany({ limit, offset });
    return { data };
  }

  async HttphandleGetQuestionnaireById(id: number) {
    return await this.provider.db.query.Task.findFirst({ where: eq(Task.id, id), with: { questions: true } });
  }

  async HttpHandleRateQuestionnaire(body: Dto.RateQuestionnaireBody, user: TUser) {
    const activity = await this.provider.db.query.TaskActivity.findFirst({
      with: { task: { columns: { id: true } } },
      where: and(
        eq(TaskActivity.userId, user.id),
        eq(TaskActivity.status, 'COMPLETED'),
        eq(TaskActivity.taskId, body.questionnaireId),
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

    // await this.provider.db.transaction(async (tx) => {
    //   Object.values(sheets).map(async (sheet) => {
    //     sheet.map((question) => {
    //       let taskId;

    //       if (question.id === 'id') taskId = await tx.insert

    //     });

    //     if (Math.random() > 2) console.log(createSlug('s'), generateCode(), Options, tx);
    //   });
    // });

    // if (Math.random() < 2) return {};

    await this.provider.db.transaction(async (tx) => {
      Object.values(sheets).map(async (sheet) => {
        const name = `${sheet?.[0]?.category}-${generateCode()}`;

        const [questionnaire] = await tx
          .insert(Task)
          .values({ type: 'QUESTIONNAIRE', name, slug: createSlug(name) })
          .returning();

        await Promise.all(
          sheet.map(async (q, i) => {
            if (!q || !q.question || !q.type) return;

            const [question] = await tx
              .insert(Question)
              .values({
                text: q.question,
                isFirst: i === 0,
                type: q.type !== 'type' ? q.type : 'LONG_ANSWER',
                taskId: questionnaire.id,
                isLast: i === sheet.length - 1,
              })
              .onConflictDoNothing()
              .returning();

            await Promise.all(
              (q?.options?.split(',') || [])?.map(async (o) => {
                await tx.insert(Options).values({ questionId: question.id, text: o }).onConflictDoNothing();
              }),
            );
          }),
        );
      });
    });

    fs.rm(file.path, () => {});
  }
}
