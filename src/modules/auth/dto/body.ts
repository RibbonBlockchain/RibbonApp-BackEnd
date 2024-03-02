import { IsNotEmpty, IsNumberString, IsPhoneNumber, Length } from 'class-validator';

export class RequestOnboardingOTP {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}

export class VerifyOnboardingOTP {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @Length(6, 6)
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}
