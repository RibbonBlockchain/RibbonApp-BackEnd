import { HasLowerCase, HasNumber, HasSpecialCharacter, HasUpperCase } from '@/core/validators';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsNumberString } from 'class-validator';

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

export class AdminCreateVaultBody {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @IsNumberString()
  points: string;
}

export class AdminWalletTransferBody {
  @IsNotEmpty()
  @IsNumberString()
  amount: string;
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
