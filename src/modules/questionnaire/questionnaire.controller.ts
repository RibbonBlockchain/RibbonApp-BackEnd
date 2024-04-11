import * as Dto from './dto';
import { VERSION_ONE } from '@/core/constants';
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
    return await this.questionnaireService.HttpHandleGetTaskCategories();
  }

  @Version(VERSION_ONE)
  @Post('/questionnaire/add')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async addQuestionnaire(@Body() body: Dto.AddQuestionnaire[]) {
    return await this.questionnaireService.HttpHandleAddQuestionnaire(body);
  }
}
