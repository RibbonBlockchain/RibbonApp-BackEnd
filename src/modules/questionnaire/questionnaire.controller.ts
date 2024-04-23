import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { VERSION_ONE } from '@/core/constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReqUser } from '../auth/decorators/user.decorator';
import { QuestionnaireService } from './questionnaire.service';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { Body, Controller, Get, Post, UploadedFile, UseInterceptors, Version } from '@nestjs/common';

@Controller()
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Version(VERSION_ONE)
  @Get('/admin/questionnaire/category')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getTaskCategory() {
    const data = await this.questionnaireService.HttpHandleGetTaskCategories();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/admin/questionnaire')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async addQuestions(@Body() body: Dto.AddQuestionnaireBody) {
    const data = await this.questionnaireService.HttpHandleAddQuestionnaire(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/admin/questionnaire/upload')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  @UseInterceptors(FileInterceptor('file', { preservePath: true, dest: 'uploads' }))
  async uploadQuestions(@UploadedFile() file: Express.Multer.File) {
    const data = await this.questionnaireService.HttpHandleUploadQuestionnaires(file);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/questionnaire/rate')
  async rateQuestionnaire(@Body() body: Dto.RateQuestionnaireBody, @ReqUser() user: TUser) {
    const data = await this.questionnaireService.HttpHandleRateQuestionnaire(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }
}
