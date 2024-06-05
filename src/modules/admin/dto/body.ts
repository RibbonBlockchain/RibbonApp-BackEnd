import { IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { HasLowerCase, HasNumber, HasSpecialCharacter, HasUpperCase } from '@/core/validators';

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

export class AdminMintVaultBody {
  @IsNumber()
  @IsNotEmpty()
  amount: number;
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

export class GetRewardPartners {
  @IsString()
  @IsOptional()
  q: string;

  @IsInt()
  @IsOptional()
  page: number;

  @IsInt()
  @IsOptional()
  pageSize: number;
}

export class GetAllNotificationsQuery {
  @IsString()
  @IsOptional()
  q: string;

  @IsInt()
  @IsOptional()
  page: number;

  @IsInt()
  @IsOptional()
  pageSize: number;
}
