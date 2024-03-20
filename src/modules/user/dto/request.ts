import { IsNotEmpty, IsNumberString, IsPhoneNumber, Length } from 'class-validator';

export class HandlePhoneVerification {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}

export class HandleVerifyPhone {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @Length(6, 6)
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}
