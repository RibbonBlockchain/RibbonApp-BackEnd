import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TwilioModule } from '../twiio/twilio.module';
import { TokenService } from '@/core/services/token.service';

@Module({
  imports: [TwilioModule],
  controllers: [TaskController],
  providers: [TaskService, TokenService],
})
export class TaskModule {}
