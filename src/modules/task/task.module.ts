import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TokenService } from '@/core/services/token.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService, TokenService],
})
export class TaskModule {}
