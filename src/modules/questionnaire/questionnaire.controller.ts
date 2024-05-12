import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Query,
  Version,
  Controller,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { VERSION_ONE } from '@/core/constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReqUser } from '../auth/decorators/user.decorator';
import { QuestionnaireService } from './questionnaire.service';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';

@Controller()
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Version(VERSION_ONE)
  @Get('/admin/questionnaire/category')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getTaskCategory(@Query() query: Dto.GetAllQuestionnaireCategoryQuery) {
    const data = await this.questionnaireService.HttpHandleGetTaskCategories(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/admin/questionnaire')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getQuestionnaires(@Query() query: Dto.GetAllQuestionnaireQuery) {
    const data = await this.questionnaireService.HttphandleGetQuestionnaires(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/admin/questionnaire/summary')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getQuestionnaireSummary() {
    const data = await this.questionnaireService.HttpHandleGetQuestionnaireSummary();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Patch('/admin/questionnaire/status')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async updateQuestionnaireStatus(@Body() body: Dto.UpdateQuestionnaireStatusBody) {
    const data = await this.questionnaireService.HttpHandleUpdateQuestionnaireStatus(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/admin/questionnaire/:id')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getQuestionnaireById(@Param('id') id: number) {
    const data = await this.questionnaireService.HttphandleGetQuestionnaireById(id);
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
  @Patch('/admin/questionnaire')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async updateQuestions(@Body() body: Dto.AddQuestionnaireBody) {
    const data = await this.questionnaireService.HttpHandleAddQuestionnaire(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/admin/questionnaire/category')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async createQuestionnaireCategory(@Body() body: Dto.CreateQuestionnaireCategoryBody) {
    const data = await this.questionnaireService.HttpHandleCreateQuestionnaireCategory(body);
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
