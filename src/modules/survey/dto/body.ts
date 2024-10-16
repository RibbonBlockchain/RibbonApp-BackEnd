import { Type } from 'class-transformer';
import { QuestionTypeMap, TQuestionType } from '@/modules/drizzle/schema';
import { IsInt, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsIn, IsString, IsOptional } from 'class-validator';

export class AddSurveyBody {
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsOptional()
  category: string;

  @IsNumber()
  reward: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  @Type(() => QuestionPayload)
  @ValidateNested({ each: true })
  questions: QuestionPayload[];
}

export class UpdateSurveyBody {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsInt()
  @IsOptional()
  categoryId: number;

  @IsNumber()
  reward: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  @Type(() => QuestionPayload)
  @ValidateNested({ each: true })
  questions: QuestionPayload[];
}

class QuestionPayload {
  @IsInt()
  @IsOptional()
  id: number;

  @IsNotEmpty()
  @IsIn(QuestionTypeMap)
  type: TQuestionType;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @IsOptional()
  @Type(() => OptionPayload)
  @ValidateNested({ each: true })
  options: OptionPayload[];
}

class OptionPayload {
  @IsInt()
  @IsOptional()
  id: number;

  @IsInt()
  @IsNotEmpty()
  point: number;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateSurveyCategoryBody {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description: string;
}

export class RateSurveyBody {
  @IsInt()
  @IsNotEmpty()
  rating: number;

  @IsInt()
  @IsNotEmpty()
  surveyId: number;
}

export class UpdateSesBody {
  @IsNotEmpty()
  @IsNumber()
  optionId: number;

  @IsNotEmpty()
  @IsNumber()
  point: number;
}

export class AnswerSurveyDto {
  @IsNotEmpty()
  @IsNumber()
  questionId: number;

  @IsNotEmpty()
  @IsNumber()
  surveyId: number;

  @IsOptional()
  optionId: string | number | string[];
}
