import * as Dto from './dto';
import { VERSION_ONE } from '@/core/constants';
import { QuestionnaireService } from './questionnaire.service';
import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { RESPONSE } from '@/core/responses';

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

  @Version(VERSION_ONE)
  @Post('/questionnaire/add')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async addQuestionnaire(@Body() body: Dto.AddQuestionnaire[]) {
    const data = await this.questionnaireService.HttpHandleAddQuestionnaire(body);
    return { data, message: RESPONSE.SUCCESS };
  }
}
