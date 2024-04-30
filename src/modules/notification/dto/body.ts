import { IsNumber, IsString } from 'class-validator';

export class SendGeneralNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;
}

export class ReadNotificationDto {
  @IsNumber()
  notificationId: number;
}
