import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { RESPONSE } from '@/core/responses';
import { VERSION_ONE } from '@/core/constants';
import { TasskService } from './tassk.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReqUser } from '../auth/decorators/user.decorator';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  Version,
} from '@nestjs/common';

@Controller()
export class TasskController {
  constructor(private readonly tassk: TasskService) {}

  @Version(VERSION_ONE)
  @Get('/admin/task/category')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getTasskCategory(@Query() query: Dto.GetTasskCategoriesQuery) {
    const data = await this.tassk.HttpHandleGetTasskCategories(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/admin/task/summary')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getQuestionnaireSummary() {
    const data = await this.tassk.HttpHandleGetTaskSummary();
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Patch('/admin/task/status')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async updateQuestionnaireStatus(@Body() body: Dto.UpdateTaskStatusBody) {
    const data = await this.tassk.HttpHandleUpdateTaskStatus(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Get('/admin/task')
  @Version(VERSION_ONE)
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async getTassks(@Query() query: Dto.GetAllTasskQuery) {
    const data = await this.tassk.HttphandleGetTassks(query);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Get('/admin/task/:id')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async adminGetTasskById(@Param('id') id: number) {
    const data = await this.tassk.HttphandleAdminGetTasskById(id);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Post('/admin/task')
  @Version(VERSION_ONE)
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async addQuestions(@Body() body: Dto.AddTasskBody) {
    const data = await this.tassk.HttpHandleAddTassk(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Patch('/admin/task')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async updateQuestions(@Body() body: Dto.UpdateTasskBody) {
    const data = await this.tassk.HttpHandleUpdateTassk(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/admin/task/category')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  async createTasskCategory(@Body() body: Dto.CreateTasskCategoryBody) {
    const data = await this.tassk.HttpHandleCreateTasskCategory(body);
    return { data, message: RESPONSE.SUCCESS };
  }

  @Version(VERSION_ONE)
  @Post('/admin/task/upload')
  @AuthGuard({ roles: ['ADMIN', 'SUPER_ADMIN'] })
  @UseInterceptors(FileInterceptor('file', { preservePath: true, dest: 'uploads' }))
  async uploadQuestions(@UploadedFile() file: Express.Multer.File) {
    const data = await this.tassk.HttpHandleUploadTassks(file);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Post('/task/rate')
  @Version(VERSION_ONE)
  async rateTassk(@Body() body: Dto.RateTasskBody, @ReqUser() user: TUser) {
    const data = await this.tassk.HttpHandleRateTassk(body, user);
    return { data, message: RESPONSE.SUCCESS };
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Get('tassk/uncompleted')
  async userUncompletedTasks(@ReqUser() user: TUser) {
    return await this.tassk.HttpHandleGetUserUnCompletedTasks(user);
  }

  @AuthGuard()
  @Get('tassk/:id')
  @Version(VERSION_ONE)
  async getTasskById(@Param() params: { id: string }) {
    return await this.tassk.HttpHandleGetTasskById(params.id);
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Get('tassk/completed')
  async getCompletedTasks(@ReqUser() user: TUser, @Query() query: { completedDate: string }) {
    return await this.tassk.HttpHandleGetCompletedTasks(user, query);
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Get('tassk/processing')
  async getProcessingTasks(@ReqUser() user: TUser) {
    return await this.tassk.HttpHandleGetProcessingTasks(user);
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('tassk/respond')
  async respondToTask(@Body() body: Dto.AnswerTaskDto, @ReqUser() user: TUser) {
    return await this.tassk.HttpHandleAnswerTask(body, user);
  }
}
