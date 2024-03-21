import {
  Length,
  IsEnum,
  IsEmail,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsPhoneNumber,
  IsNumberString,
} from 'class-validator';
import { GenderEnum, TGender } from '@/modules/drizzle/schema';

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

  @IsOptional()
  @IsEnum(GenderEnum)
  gender: TGender;

  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email: string;

  @IsNotEmpty()
  @IsOptional()
  @IsDateString()
  dob: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  discordUsername: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  xUsername: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  instagramUsername: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  linkedInUsername: string;
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
