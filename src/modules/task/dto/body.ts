import { IsInt, IsNotEmpty, IsNumber, IsNumberString, IsPhoneNumber, IsString, Length } from 'class-validator';

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

export class AddQuestionnaire {
  @IsString()
  type: any;

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  question: string;
}
