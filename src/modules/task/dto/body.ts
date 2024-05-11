import { IsNotEmpty, IsNumber, IsNumberString, IsPhoneNumber, Length } from 'class-validator';

export class TaskQuestionResponseDto {
  @IsNotEmpty()
  @IsNumber()
  questionId: number;

  @IsNotEmpty()
  @IsNumber()
  taskId: number;

  @IsNotEmpty()
  @IsNumber()
  optionId: number;
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

export class UpdateSes {
  @IsNotEmpty()
  @IsNumber()
  optionId: number;

  @IsNotEmpty()
  @IsNumber()
  point: number;
}
