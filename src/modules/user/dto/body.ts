import {
  Length,
  IsEmail,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsPhoneNumber,
  IsNumberString,
  IsNumber,
} from 'class-validator';
import { TGender } from '@/modules/drizzle/schema';

export class HandleUpdateProfile {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  otherNames: string;

  @IsString()
  @IsOptional()
  gender: TGender;

  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email: string;

  @IsNotEmpty()
  @IsOptional()
  @IsDateString()
  dob: string;

  @IsOptional()
  socials: any;
}

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

export class HandleClaimPoints {
  @IsNumber()
  @IsNotEmpty()
  amount: string;
}
