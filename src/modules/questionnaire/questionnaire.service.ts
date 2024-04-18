import * as Dto from './dto';
import { and, eq } from 'drizzle-orm';
import { DATABASE } from '@/core/constants';
import { RESPONSE } from '@/core/responses';
import { TDbProvider } from '../drizzle/drizzle.module';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Question, QuestionnaireRating, TUser, TaskActivity } from '../drizzle/schema';

@Injectable()
export class QuestionnaireService {
  constructor(@Inject(DATABASE) private readonly provider: TDbProvider) {}

  async HttpHandleAddQuestionnaire(body: Dto.AddQuestionnaire[]) {
    await this.provider.db.transaction(async (tx) => {
      await Promise.all(
        body.map((data) => {
          tx.insert(Question).values({ type: data.type, taskId: data.categoryId, text: data.question });
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
}
