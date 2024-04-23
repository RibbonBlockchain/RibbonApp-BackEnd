import fs from 'fs';
import * as Dto from './dto';
import csvtojson from 'csvtojson';
import { and, eq } from 'drizzle-orm';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
//import excelToJson from 'convert-excel-to-json';
import { TDbProvider } from '../drizzle/drizzle.module';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Question, QuestionnaireCategory, QuestionnaireRating, TUser, Task, TaskActivity } from '../drizzle/schema';

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

  async HttpHandleRateQuestionnaire(body: Dto.RateQuestionnaireBody, user: TUser) {
    const activity = await this.provider.db.query.TaskActivity.findFirst({
      with: { task: { columns: { id: true } } },
      where: and(
        eq(TaskActivity.userId, user.id),
        eq(TaskActivity.id, body.activityId),
        eq(TaskActivity.status, 'COMPLETED'),
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
    console.log(await csvtojson({ alwaysSplitAtEOL: true, trim: true }).fromFile(file.path));

    // console.log(
    //   excelToJson({
    //     includeEmptyLines: true,
    //     header: { rows: 1 },
    //     sourceFile: file.path,
    //     columnToKey: { '*': '{{columnHeader}}' },
    //   }),
    // );

    fs.rm(file.path, () => {});
  }
}
