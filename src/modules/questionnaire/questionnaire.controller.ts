import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { VERSION_ONE } from '@/core/constants';
import { ReqUser } from '../auth/decorators/user.decorator';
import { QuestionnaireService } from './questionnaire.service';
import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';

@Controller('questionnaire')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Version(VERSION_ONE)
  @Get('/admin/category')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getTaskCategory() {
    const data = await this.questionnaireService.HttpHandleGetTaskCategories();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Post('/admin/add')
  @Version(VERSION_ONE)
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async addQuestionnaire(@Body() body: Dto.AddQuestionnaire[]) {
    const data = await this.questionnaireService.HttpHandleAddQuestionnaire(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Post('/rate')
  @Version(VERSION_ONE)
  async rateQuestionnaire(@Body() body: Dto.RateQuestionnaireBody, @ReqUser() user: TUser) {
    const data = await this.questionnaireService.HttpHandleRateQuestionnaire(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }
}
