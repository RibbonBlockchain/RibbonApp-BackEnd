import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { VERSION_ONE } from '@/core/constants';
import { SurveyService } from './survey.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReqUser } from '../auth/decorators/user.decorator';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors, Version } from '@nestjs/common';

@Controller()
export class SurveyController {
  constructor(private readonly survey: SurveyService) {}

  @Version(VERSION_ONE)
  @Get('/admin/survey/category')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getSurveyCategory() {
    const data = await this.survey.HttpHandleGetSurveyCategories();
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
  @Get('/admin/survey/:id')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getSurveyById(@Param('id') id: number) {
    const data = await this.survey.HttphandleGetSurveyById(id);
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
}
