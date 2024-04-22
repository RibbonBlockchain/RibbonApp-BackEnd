import { IsString } from 'class-validator';

export class SendGeneralNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;
}
