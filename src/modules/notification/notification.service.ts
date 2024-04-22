import { DATABASE } from '@/core/constants';
import { Inject, Injectable } from '@nestjs/common';
import { TDbProvider } from '../drizzle/drizzle.module';
import * as Dto from './dto';
import { Notification } from '../drizzle/schema';

@Injectable()
export class NotificationService {
  constructor(@Inject(DATABASE) private readonly provider: TDbProvider) {}

  async HttpHandleSendGeneralNotification(body: Dto.SendGeneralNotificationDto) {
    const { message, title } = body;
    const users = await this.provider.db.query.User.findMany({ with: {} });

    if (users.length <= 0) return { data: {} };

    users.map(async (user) => {
      await this.provider.db.insert(Notification).values({ message, title, userId: user.id }).execute();
    });

    return {};
  }
}
