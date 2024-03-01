import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class RequestOnboardingOTP {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}
