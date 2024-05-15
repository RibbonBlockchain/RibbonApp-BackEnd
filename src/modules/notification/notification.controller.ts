import * as Dto from './dto';
import { TUser } from '../drizzle/schema';
import { VERSION_ONE } from '@/core/constants';
import { ReqUser } from '../auth/decorators/user.decorator';
import { NotificationService } from './notification.service';
import { Body, Controller, Post, Version } from '@nestjs/common';
import { Auth as AuthGuard } from '../auth/decorators/auth.decorator';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/send-general')
  async sendGeneralNotification(@ReqUser() user: TUser | undefined, @Body() body: Dto.SendGeneralNotificationDto) {
    return await this.notificationService.HttpHandleSendGeneralNotification(body, user);
  }

  @AuthGuard()
  @Version(VERSION_ONE)
  @Post('/read')
  async requestPhoneVerificationTask(@Body() body: Dto.ReadNotificationDto, @ReqUser() user: TUser) {
    return await this.notificationService.HttpHandleReadNotification(body, user);
  }
}
