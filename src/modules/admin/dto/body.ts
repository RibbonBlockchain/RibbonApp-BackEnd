import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginBody {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
