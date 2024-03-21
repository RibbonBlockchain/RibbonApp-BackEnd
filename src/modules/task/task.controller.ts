import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { TaskService } from './task.service';
import { VERSION_ONE } from '@/core/constants';
import { ReqUser } from '../auth/decorators/user.decorator';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { Body, Controller, Get, Param, Post, Version } from '@nestjs/common';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @AuthGuard()
  @Version(VERSION_ONE)
  async getTasks() {
    return await this.taskService.HttpHandleGetTasks();
  }

  @Get(':id')
  @AuthGuard()
  @Version(VERSION_ONE)
  async getTaskById(@Param() params: { id: string }) {
    return await this.taskService.HttpHandleGetTaskById(params.id);
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/request/verify-your-phone-number')
  async requestPhoneVerificationTask(@Body() body: Dto.RequestPhoneVerificationTask, @ReqUser() user: TUser) {
    return await this.taskService.HttpHandleRequestPhoneVerificationTask(body, user);
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/complete/verify-your-phone-number')
  async completePhoneVerificationTask(@Body() body: Dto.CompletePhoneVerificationTask, @ReqUser() user: TUser) {
    return await this.taskService.HttpHandleCompletePhoneVerificationTask(body, user);
  }

  @AuthGuard()
  @Post('user/respond')
  @Version(VERSION_ONE)
  async respondToTask(@Body() body: Dto.TaskQuestionResponseDto, @ReqUser() user: TUser) {
    return await this.taskService.HttpHandleAnswerTaskQuestion(body, user);
  }

  @AuthGuard()
  @Get('user/processing')
  @Version(VERSION_ONE)
  async userProcessingTasks(@ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserProcessingTasks(user);
  }

  @AuthGuard()
  @Get('user/uncompleted')
  @Version(VERSION_ONE)
  async userUncompletedTasks(@ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserUnCompletedTasks(user);
  }

  @AuthGuard()
  @Get('user/completed')
  @Version(VERSION_ONE)
  async userCompletedTasks(@ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserCompletedTasks(user);
  }

  @AuthGuard()
  @Get('user/activity/:id')
  @Version(VERSION_ONE)
  async userTaskActivity(@Param() params: { id: string }, @ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserTaskActivity(user, +params.id);
  }

  @AuthGuard()
  @Get('user/activity')
  @Version(VERSION_ONE)
  async userTaskActivities(@ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserTaskActivities(user);
  }
}
