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
import { SurveyService } from './survey.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReqUser } from '../auth/decorators/user.decorator';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';

@Controller()
export class SurveyController {
  constructor(private readonly survey: SurveyService) {}

  @Version(VERSION_ONE)
  @Get('/admin/survey/category')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getSurveyCategory(@Query() query: Dto.GetSurveyCategoriesQuery) {
    const data = await this.survey.HttpHandleGetSurveyCategories(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/admin/survey')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getSurveys(@Query() query: Dto.GetAllSurveyQuery) {
    const data = await this.survey.HttphandleGetSurveys(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/admin/survey/summary')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getSurveySummary() {
    const data = await this.survey.HttpHandleGetSurveySummary();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Patch('/admin/survey/status')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async updateSurveyStatus(@Body() body: Dto.UpdateSurveyStatusBody) {
    const data = await this.survey.HttpHandleUpdateSurveyStatus(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/admin/survey/:id')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async adminGetSurveyById(@Param('id') id: number) {
    const data = await this.survey.HttphandleAdminGetSurveyById(id);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/admin/survey')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async addQuestions(@Body() body: Dto.AddSurveyBody) {
    const data = await this.survey.HttpHandleAddSurvey(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Patch('/admin/survey')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async updateQuestions(@Body() body: Dto.UpdateSurveyBody) {
    const data = await this.survey.HttpHandleUpdateQuestionnaire(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/admin/survey/category')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async createSurveyCategory(@Body() body: Dto.CreateSurveyCategoryBody) {
    const data = await this.survey.HttpHandleCreateSurveyCategory(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/admin/survey/upload')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  @UseInterceptors(FileInterceptor('file', { preservePath: true, dest: 'uploads' }))
  async uploadQuestions(@UploadedFile() file: Express.Multer.File) {
    const data = await this.survey.HttpHandleUploadSurveys(file);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/survey/rate')
  async rateSurvey(@Body() body: Dto.RateSurveyBody, @ReqUser() user: TUser) {
    const data = await this.survey.HttpHandleRateSurvey(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Patch('survey/update-ses')
  async updateSes(@Body() body: Dto.UpdateSesBody[]) {
    return await this.survey.HttpHandleUpdateSes(body);
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Get('survey/uncompleted')
  async userUncompletedTasks(@ReqUser() user: TUser) {
    return await this.survey.HttpHandleGetUserUnCompletedSurveys(user);
  }

  @AuthGuard()
  @Get('survey/:id')
  @Version(VERSION_ONE)
  async getSurveyById(@Param() params: { id: string }) {
    return await this.survey.HttpHandleGetSurveyById(params.id);
  }
}
