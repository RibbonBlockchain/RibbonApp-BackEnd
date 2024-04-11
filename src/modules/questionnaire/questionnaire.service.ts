import * as Dto from './dto';
import { DATABASE } from '@/core/constants';
import { Question } from '../drizzle/schema';
import { TDbProvider } from '../drizzle/drizzle.module';
import { Inject, Injectable } from '@nestjs/common';

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
}
