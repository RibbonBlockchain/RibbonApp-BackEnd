import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TokenService } from '@/core/services/token.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, TokenService],
})
export class NotificationModule {}
