import { IsInt, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsPhoneNumber, Length } from 'class-validator';

export class TaskQuestionResponseDto {
  @IsNotEmpty()
  @IsNumber()
  questionId: number;

  @IsNotEmpty()
  @IsNumber()
  taskId: number;

  @IsOptional()
  optionId: string | number | string[];
}

export class RequestPhoneVerificationTask {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}

export class CompletePhoneVerificationTask {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @Length(6, 6)
  @IsNotEmpty()
  @IsNumberString()
  code: string;
}

export class UpdateSesData {
  @IsNotEmpty()
  @IsNumber()
  optionId: number;

  @IsNotEmpty()
  @IsNumber()
  point: number;
}

export class RateTaskBody {
  @IsInt()
  @IsNotEmpty()
  rating: number;

  @IsInt()
  @IsNotEmpty()
  taskId: number;
}
