import { Body, Controller, Get, Param, Post, Version } from '@nestjs/common';
import { TaskService } from './task.service';
import { VERSION_ONE } from '@/core/constants';
import { TaskQuestionResponseDto } from './dto/request';
import { TUser } from '../drizzle/schema';
import { ReqUser } from '../auth/decorators/user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @Version(VERSION_ONE)
  async getTasks() {
    return await this.taskService.HttpHandleGetTasks();
  }

  @Get(':id')
  @Version(VERSION_ONE)
  async getTaskById(@Param() params: { id: string }) {
    return await this.taskService.HttpHandleGetTaskById(+params.id);
  }

  @Post('user/respond')
  @Version(VERSION_ONE)
  @Auth()
  async respondToTask(@Body() body: TaskQuestionResponseDto, @ReqUser() user: TUser) {
    return await this.taskService.HttpHandleAnswerTaskQuestion(body, user);
  }

  @Get('user/processing')
  @Version(VERSION_ONE)
  @Auth()
  async userProcessingTasks(@ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserProcessingTasks(user);
  }

  @Get('user/uncompleted')
  @Version(VERSION_ONE)
  @Auth()
  async userUncompletedTasks(@ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserUnCompletedTasks(user);
  }

  @Get('user/completed')
  @Version(VERSION_ONE)
  @Auth()
  async userCompletedTasks(@ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserCompletedTasks(user);
  }

  @Get('user/activity/:id')
  @Version(VERSION_ONE)
  @Auth()
  async userTaskActivity(@Param() params: { id: string }, @ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserTaskActivity(user, +params.id);
  }

  @Get('user/activity')
  @Version(VERSION_ONE)
  @Auth()
  async userTaskActivities(@ReqUser() user: TUser) {
    return await this.taskService.HttpHandleGetUserTaskActivities(user);
  }
}
