import { HasLowerCase, HasNumber, HasSpecialCharacter, HasUpperCase } from '@/core/validators';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginBody {
  @IsString()
  @HasNumber()
  @IsNotEmpty()
  @HasUpperCase()
  @HasLowerCase()
  @HasSpecialCharacter()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class AdminChangePasswordBody {
  @IsString()
  @HasNumber()
  @IsNotEmpty()
  @HasUpperCase()
  @HasLowerCase()
  @HasSpecialCharacter()
  oldPassword: string;

  @IsString()
  @HasNumber()
  @IsNotEmpty()
  @HasUpperCase()
  @HasLowerCase()
  @HasSpecialCharacter()
  newPassword: string;
}
