import { Body, Controller, Post, Version } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { VERSION_ONE } from '@/core/constants';
import * as Dto from './dto';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';
import { ReqUser } from '../auth/decorators/user.decorator';
import { TUser } from '../drizzle/schema';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/send-general')
  async sendGeneralNotification(@Body() body: Dto.SendGeneralNotificationDto) {
    return await this.notificationService.HttpHandleSendGeneralNotification(body);
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/read')
  async requestPhoneVerificationTask(@Body() body: Dto.ReadNotificationDto, @ReqUser() user: TUser) {
    return await this.notificationService.HttpHandleReadNotification(body, user);
  }
}
