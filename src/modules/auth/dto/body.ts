import { IsNotEmpty, IsNumberString, IsPhoneNumber, Length } from 'class-validator';

export class HandlePhoneAuth {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}

export class VerifyAuthPin {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @Length(4, 4)
  @IsNotEmpty()
  @IsNumberString()
  pin: string;
}

export class VerifyPhoneAuthOTP {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @Length(6, 6)
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}

export class PhoneOnboard {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @Length(4, 4)
  @IsNotEmpty()
  @IsNumberString()
  pin: string;

  @Length(6, 6)
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}
