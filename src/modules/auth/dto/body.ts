import { IsNotEmpty, IsNumberString, IsPhoneNumber, Length } from 'class-validator';

export class HandleCheckPhone {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}

export class HandlePhoneSignUp {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}

export class HandlePhoneLogin {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @Length(4, 4)
  @IsNotEmpty()
  @IsNumberString()
  pin: string;
}

export class VerifyPhoneSignUp {
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
