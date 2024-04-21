import { IsString } from 'class-validator';

export class SendGeneralNotificationDto {
  @IsString()
  message: string;
}
